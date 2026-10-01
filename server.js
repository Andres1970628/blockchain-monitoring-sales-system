const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(LEADS_FILE)) {
    fs.writeFileSync(LEADS_FILE, '[]', 'utf8');
  }
}

function readLeads() {
  ensureDataFile();
  try {
    const content = fs.readFileSync(LEADS_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch (error) {
    return [];
  }
}

function writeLeads(leads) {
  ensureDataFile();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Blockchain Monitor Pro API is live' });
});

app.get('/api/leads', (req, res) => {
  res.json({ success: true, data: readLeads() });
});

app.post('/api/leads', (req, res) => {
  const body = req.body || {};
  const email = String(body.email || '').trim();
  const name = String(body.name || '').trim();
  const company = String(body.company || '').trim();
  const plan = String(body.plan || '').trim();
  const message = String(body.message || '').trim();
  const type = body.type || 'demo';

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Email is invalid.' });
  }

  const lead = {
    id: Date.now().toString(),
    name: name || 'Unknown',
    email,
    company: company || 'N/A',
    type,
    plan: plan || 'Not specified',
    message,
    createdAt: new Date().toISOString(),
    source: 'web'
  };

  const leads = readLeads();
  leads.unshift(lead);
  writeLeads(leads.slice(0, 500));

  return res.status(201).json({ success: true, message: 'Lead accepted.', data: lead });
});

app.get('/api/lead-export', (req, res) => {
  const leads = readLeads();
  const csv = [
    'id,name,email,company,type,plan,message,createdAt,source',
    ...leads.map((lead) => [
      lead.id,
      `"${String(lead.name || '').replace(/"/g, '""')}"`,
      `"${String(lead.email || '').replace(/"/g, '""')}"`,
      `"${String(lead.company || '').replace(/"/g, '""')}"`,
      lead.type,
      `"${String(lead.plan || '').replace(/"/g, '""')}"`,
      `"${String(lead.message || '').replace(/"/g, '""')}"`,
      lead.createdAt,
      lead.source
    ].join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="blockchain-monitor-leads.csv"');
  res.send(csv);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Blockchain Monitor Pro is running on http://localhost:${PORT}`);
});
