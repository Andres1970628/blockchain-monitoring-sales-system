require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const app = express();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Blockchain Monitor Pro is running' });
});

// ========== LEAD CAPTURE ==========
app.post('/api/leads', async (req, res) => {
  try {
    const { name, email, company, plan, message, type } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }

    const lead = await prisma.lead.create({
      data: {
        name: name || 'Unknown',
        email,
        company: company || 'N/A',
        plan: plan || 'Not specified',
        message: message || '',
        type: type || 'demo',
        source: 'web',
        status: 'new'
      }
    });

    // Send confirmation email
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Demo Request Received - Blockchain Monitor Pro',
        html: `
          <h2>Thanks for your interest!</h2>
          <p>Hi ${name},</p>
          <p>We received your ${type} request for <strong>${plan}</strong> plan.</p>
          <p>Our team will contact you within 24 hours at ${email}.</p>
          <p>Best regards,<br>Blockchain Monitor Pro Team</p>
        `
      });

      // Send admin notification
      await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject: `New ${type} - ${email}`,
        html: `
          <h3>New Lead Captured</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Plan:</strong> ${plan}</p>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        `
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Lead saved successfully',
      data: lead
    });
  } catch (error) {
    console.error('Lead error:', error);
    return res.status(500).json({ success: false, message: 'Error saving lead' });
  }
});

// ========== GET ALL LEADS (ADMIN) ==========
app.get('/api/admin/leads', async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return res.json({ success: true, data: leads });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching leads' });
  }
});

// ========== STRIPE CHECKOUT ==========
app.post('/api/checkout', async (req, res) => {
  try {
    const { email, plan } = req.body;

    if (!email || !plan) {
      return res.status(400).json({ success: false, message: 'Email and plan required' });
    }

    const priceMap = {
      starter: process.env.STRIPE_PRICE_STARTER || 'price_starter',
      pro: process.env.STRIPE_PRICE_PRO || 'price_pro',
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise'
    };

    const priceId = priceMap[plan] || priceMap.pro;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/#pricing`,
      automatic_tax: { enabled: true }
    });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ success: false, message: 'Error creating checkout session' });
  }
});

// ========== STRIPE WEBHOOK ==========
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const email = subscription.customer_email || subscription.billing_details?.email;

      if (email && subscription.items.data[0]) {
        const priceId = subscription.items.data[0].price.id;
        const planMap = {
          [process.env.STRIPE_PRICE_STARTER]: 'starter',
          [process.env.STRIPE_PRICE_PRO]: 'pro',
          [process.env.STRIPE_PRICE_ENTERPRISE]: 'enterprise'
        };

        const plan = planMap[priceId] || 'pro';

        await prisma.subscription.upsert({
          where: { email },
          create: {
            email,
            stripeId: subscription.id,
            plan,
            status: subscription.status,
            amount: subscription.items.data[0].price.unit_amount || 0,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
          },
          update: {
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
          }
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      await prisma.subscription.updateMany({
        where: { stripeId: subscription.id },
        data: { status: 'canceled', canceledAt: new Date() }
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// ========== PRICING PLANS ==========
app.get('/api/pricing', (req, res) => {
  const plans = [
    {
      name: 'Starter',
      price: 99,
      period: '/month',
      features: ['1 chain', '3 dashboards', 'Email alerts', 'Basic reports']
    },
    {
      name: 'Pro',
      price: 299,
      period: '/month',
      featured: true,
      features: ['5 chains', 'Advanced analytics', 'Smart alerting', 'API access', 'Priority support']
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: ['Private deployment', 'SSO/SAML', 'Priority SLA', 'Custom integrations']
    }
  ];

  res.json({ success: true, data: plans });
});

// ========== STATISTICS ==========
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalLeads = await prisma.lead.count();
    const demoRequests = await prisma.lead.count({ where: { type: 'demo' } });
    const contacts = await prisma.lead.count({ where: { type: 'contact' } });
    const activeSubscriptions = await prisma.subscription.count({ where: { status: 'active' } });

    return res.json({
      success: true,
      data: {
        totalLeads,
        demoRequests,
        contacts,
        activeSubscriptions
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

// ========== SERVE STATIC FILES ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`✅ Blockchain Monitor Pro running on http://localhost:${PORT}`);
});

module.exports = app;
