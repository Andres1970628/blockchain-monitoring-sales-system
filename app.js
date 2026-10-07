const demoMetrics = [
  { label: 'TVL', value: '$42.8M', icon: 'fa-wallet', change: '+5.2%', positive: true },
  { label: 'Net inflow', value: '$1.24M', icon: 'fa-arrow-trend-up', change: '+3.7%', positive: true },
  { label: 'Avg fees', value: '$86.2K', icon: 'fa-dollar-sign', change: '-1.8%', positive: false },
  { label: 'Validator uptime', value: '99.94%', icon: 'fa-shield-heart', change: '+0.4%', positive: true }
];

const liveMetrics = [
  { label: 'TVL', value: '$46.6M', icon: 'fa-wallet', change: '+7.8%', positive: true },
  { label: 'Net inflow', value: '$2.11M', icon: 'fa-arrow-trend-up', change: '+9.4%', positive: true },
  { label: 'Avg fees', value: '$73.4K', icon: 'fa-dollar-sign', change: '-4.9%', positive: false },
  { label: 'Validator uptime', value: '99.97%', icon: 'fa-shield-heart', change: '+0.7%', positive: true }
];

const signalData = [
  { label: 'Network health', value: 'Stable', color: 'green' },
  { label: 'Liquidity ratio', value: '92.4%', color: 'blue' },
  { label: 'P2P volume', value: '$1.8M', color: 'orange' },
  { label: 'Risk index', value: 'Low', color: 'red' }
];

const alertData = [
  { type: 'warning', title: 'Gas spike detected', text: 'Ethereum gas fees rose 18% above the 7-day median.', icon: 'fa-triangle-exclamation' },
  { type: 'error', title: 'Node latency spike', text: 'Two secondary nodes are reporting elevated latency.', icon: 'fa-bolt' },
  { type: 'success', title: 'Validator rotation', text: 'Three validators joined the active set successfully.', icon: 'fa-circle-check' }
];

const txData = [
  { net: 'Ethereum', hash: '0x8d77...a85f', type: 'Swap', amount: '$28,400', fee: '$4.10', status: 'Confirmed' },
  { net: 'Bitcoin', hash: '0xf91a...229c', type: 'Transfer', amount: '$19,200', fee: '$2.70', status: 'Confirmed' },
  { net: 'Solana', hash: '0x7a2d...bb4d', type: 'Staking', amount: '$6,500', fee: '$0.40', status: 'Pending' },
  { net: 'Ethereum', hash: '0xc44b...ef09', type: 'Bridge', amount: '$12,800', fee: '$3.95', status: 'Failed' },
  { net: 'Bitcoin', hash: '0x201a...d776', type: 'Custody', amount: '$41,000', fee: '$2.10', status: 'Confirmed' },
  { net: 'Solana', hash: '0x88ac...23d9', type: 'Transfer', amount: '$3,850', fee: '$0.29', status: 'Confirmed' }
];

// Base de Inteligencia y Atribución de Scammers + Análisis de Exposición Indirecta (Taint & CEX)
const scammerIntelligence = {
  '0xc44b...ef09': { 
    entityName: 'Drainer Syndicate Alpha', 
    actorAlias: 'PhishMaster_99 / Cluster X', 
    riskLevel: 'Critical', 
    multiHopNodes: 5,
    taintRatio: '24.5%', 
    cexExposure: 'Binance (Deposit Address #402)',
    notes: 'Fondos divididos en 5 carteras intermediarias. Criterio legal habilitado para congelamiento en CEX.' 
  },
  '0x7a2d...bb4d': { 
    entityName: 'Rugpull Ops / Fake Staking', 
    actorAlias: 'SolanaDrainer Team B', 
    riskLevel: 'High', 
    multiHopNodes: 2,
    taintRatio: '12.0%', 
    cexExposure: 'OKX (P2P Settlement Node)',
    notes: 'Patrón de blanqueo a través de mezcladores y cuentas P2P secundarias.' 
  }
};

const chartSeries = {
  '1H': [16, 22, 18, 28, 34, 36, 42, 48, 52, 58, 64, 70],
  '24H': [10, 16, 18, 25, 31, 36, 40, 45, 48, 56, 63, 78],
  '7D': [8, 14, 18, 22, 30, 36, 42, 46, 54, 60, 70, 82],
  '30D': [5, 9, 13, 18, 22, 29, 34, 41, 48, 57, 69, 84]
};

const chartLabelsMap = {
  '1H': ['-55m', '-50m', '-45m', '-40m', '-35m', '-30m', '-25m', '-20m', '-15m', '-10m', '-5m', 'Now'],
  '24H': ['02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00'],
  '7D': ['Day 1', 'Day 1.5', 'Day 2', 'Day 2.5', 'Day 3', 'Day 3.5', 'Day 4', 'Day 4.5', 'Day 5', 'Day 6', 'Day 6.5', 'Day 7'],
  '30D': ['Week 1', 'W1.5', 'Week 2', 'W2.5', 'Week 3', 'W3.5', 'Week 4', 'W4.5', 'Week 5', 'W5.5', 'Week 6', 'Month End']
};

const statusMap = {
  Confirmed: 'confirmed',
  Pending: 'pending',
  Failed: 'failed'
};

const state = {
  mode: 'demo',
  range: '1H'
};

let mainChart;

// ========== DASHBOARD FUNCTIONS ==========

function renderMetrics() {
  const metrics = state.mode === 'demo' ? demoMetrics : liveMetrics;
  const el = document.getElementById('metricsGrid');
  if (!el) return;

  el.innerHTML = metrics.map(item => `
    <article class="metric-card">
      <div class="metric-head">
        <span>${item.label}</span>
        <span class="metric-icon"><i class="fa-solid ${item.icon}"></i></span>
      </div>
      <div class="metric-value">${item.value}</div>
      <div class="metric-change ${item.positive ? '' : 'down'}">
        <i class="fa-solid ${item.positive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>
        ${item.change}
      </div>
    </article>
  `).join('');
}

function renderSignals() {
  const el = document.getElementById('signalList');
  if (!el) return;

  el.innerHTML = signalData.map(item => `
    <div class="signal-item">
      <div class="signal-name"><span class="signal-dot ${item.color}"></span>${item.label}</div>
      <div class="signal-value">${item.value}</div>
    </div>
  `).join('');
}

function renderAlerts() {
  const el = document.getElementById('alertList');
  if (!el) return;

  el.innerHTML = alertData.map(item => `
    <div class="alert-item ${item.type}">
      <div class="alert-icon"><i class="fa-solid ${item.icon}"></i></div>
      <div class="alert-content">
        <strong>${item.title}</strong>
        <span>${item.text}</span>
      </div>
    </div>
  `).join('');
}

function renderTxTable() {
  const el = document.getElementById('txTable');
  if (!el) return;

  el.innerHTML = txData.map(row => {
    const threat = scammerIntelligence[row.hash];
    const threatBadge = threat ? `<span class="status-tag failed" title="${threat.entityName}: ${threat.actorAlias} (Taint: ${threat.taintRatio})" style="cursor: pointer; margin-left: 6px;"><i class="fa-solid fa-user-secret"></i> ${threat.entityName}</span>` : '';
    
    return `
      <tr>
        <td><span class="network-tag">${row.net}</span></td>
        <td class="tx-hash">${row.hash} ${threatBadge}</td>
        <td>${row.type}</td>
        <td>${row.amount}</td>
        <td>${row.fee}</td>
        <td><span class="status-tag ${statusMap[row.status] || 'confirmed'}">${row.status}</span></td>
      </tr>
    `;
  }).join('');
}

// Panel forense de exposición indirecta, multi-hop, taint analysis y CEX freeze
function renderScammerIntelPanel() {
  const el = document.getElementById('scammerIntelPanel');
  if (!el) return;

  const entries = Object.entries(scammerIntelligence);
  el.innerHTML = entries.map(([hash, data]) => `
    <div class="alert-item error" style="margin-bottom: 12px; padding: 14px; border-radius: 8px; background: rgba(239, 68, 68, 0.08);">
      <div class="alert-icon"><i class="fa-solid fa-user-secret" style="font-size: 1.2rem;"></i></div>
      <div class="alert-content" style="width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="font-size: 1rem; color: #f8fafc;">Entity: ${data.entityName}</strong>
          <span class="status-tag failed" style="font-size: 0.75rem;">Risk: ${data.riskLevel}</span>
        </div>
        <p style="margin: 4px 0; font-size: 0.88rem; color: #cbd5e1;">
          <strong>Attribution Alias:</strong> ${data.actorAlias}
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(148, 163, 184, 0.15); font-size: 0.82rem; color: #94a3b8;">
          <div><i class="fa-solid fa-code-fork"></i> Multi-Hop: <strong>${data.multiHopNodes} intermeds</strong></div>
          <div><i class="fa-solid fa-percent"></i> Taint Ratio: <strong style="color: #f87171;">${data.taintRatio}</strong></div>
          <div><i class="fa-solid fa-building-columns"></i> CEX Exposure: <strong style="color: #60a5fa;">${data.cexExposure}</strong></div>
        </div>
        <div style="margin-top: 6px; font-size: 0.78rem; color: #64748b;">
          Tx Hash clave: ${hash} — <em>${data.notes}</em>
        </div>
      </div>
    </div>
  `).join('');
}

function renderChart() {
  const el = document.getElementById('mainChart');
  if (!el) return;

  const ctx = el.getContext('2d');
  const labels = chartLabelsMap[state.range] || chartLabelsMap['1H'];
  const data = chartSeries[state.range] || chartSeries['1H'];

  if (mainChart) mainChart.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(96, 165, 250, 0.35)');
  gradient.addColorStop(1, 'rgba(96, 165, 250, 0.0)');

  mainChart = new Chart(el, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Flow volume',
        data,
        borderColor: '#60a5fa',
        backgroundColor: gradient,
        borderWidth: 2.5,
        fill: true,
        tension: 0.42,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#60a5fa',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(9, 12, 24, 0.94)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
          borderWidth: 1,
          padding: 12,
          titleColor: '#f8fafc',
          bodyColor: '#94a3b8',
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return ` Flow: $${context.parsed.y}M`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
        y: { 
          grid: { color: 'rgba(148, 163, 184, 0.08)', borderDash: [4, 4] }, 
          ticks: { color: '#94a3b8', font: { size: 11 }, callback: value => '$' + value + 'M' } 
        }
      }
    }
  });
}

function bindControls() {
  document.querySelectorAll('.segment').forEach(button => {
    button.addEventListener('click', () => {
      state.mode = button.dataset.mode;
      document.querySelectorAll('.segment').forEach(btn => btn.classList.toggle('active', btn === button));
      renderMetrics();
    });
  });

  document.querySelectorAll('.range').forEach(button => {
    button.addEventListener('click', () => {
      state.range = button.dataset.range;
      document.querySelectorAll('.range').forEach(btn => btn.classList.toggle('active', btn === button));
      renderChart();
    });
  });
}

// ========== LEAD CAPTURE & FORMS ==========

class LeadManager {
  constructor() {
    this.storageKey = 'blockchain_monitor_pro_leads';
    this.loadLeads();
  }

  loadLeads() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      this.leads = stored ? JSON.parse(stored) : [];
    } catch (e) {
      this.leads = [];
    }
  }

  saveLead(data) {
    const lead = {
      id: Date.now().toString(),
      ...data,
      source: this.detectSource(),
      createdAt: new Date().toISOString(),
      read: false
    };

    this.leads.unshift(lead);
    localStorage.setItem(this.storageKey, JSON.stringify(this.leads.slice(0, 500)));
    return lead;
  }

  detectSource() {
    return window.location.pathname.includes('dashboard') ? 'dashboard' : 'landing';
  }

  getAllLeads() {
    return this.leads;
  }

  exportAsJSON() {
    return JSON.stringify(this.leads, null, 2);
  }

  exportAsCSV() {
    if (!this.leads.length) return '';
    const headers = Object.keys(this.leads[0]).join(',');
    const rows = this.leads.map(lead =>
      Object.values(lead)
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    return [headers, ...rows].join('\n');
  }
}

const leadManager = new LeadManager();

function showNotification(message, type = 'success') {
  const existing = document.getElementById('notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'notification';
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-inner">
      <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

function initDemoForm() {
  const form = document.getElementById('demoForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    if (!data.email || !data.name || !data.company) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    leadManager.saveLead(data);
    showNotification(`Demo request received! We'll contact ${data.email} shortly.`, 'success');
    form.reset();
  });
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    if (!data.email || !data.message) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    leadManager.saveLead({ ...data, type: 'contact' });
    showNotification('Message received! We\'ll get back to you soon.', 'success');
    form.reset();
  });
}

function initPricingCTA() {
  const buttons = document.querySelectorAll('[data-plan]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      const email = prompt(`Enter your email to get started with ${plan} plan:`);

      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        leadManager.saveLead({ email, plan, type: 'pricing' });
        showNotification(`Great! We'll send ${plan} details to ${email}`, 'success');
      } else if (email) {
        showNotification('Please enter a valid email', 'error');
      }
    });
  });
}

// ========== ADMIN PANEL ==========

function initAdminPanel() {
  const adminBtn = document.getElementById('adminPanelBtn');
  const adminPanel = document.getElementById('adminPanel');
  const adminCode = 'admin2026';

  if (!adminBtn || !adminPanel) return;

  adminBtn.addEventListener('click', () => {
    const password = prompt('Admin password:');
    if (password === adminCode) {
      renderAdminPanel();
      adminPanel.classList.add('active');
    } else if (password) {
      alert('Incorrect password');
    }
  });

  document.addEventListener('click', (e) => {
    if (adminPanel.classList.contains('active') && !adminPanel.contains(e.target) && e.target !== adminBtn) {
      adminPanel.classList.remove('active');
    }
  });
}

function renderAdminPanel() {
  const leads = leadManager.getAllLeads();
  const leadsHtml = leads.slice(0, 10).map(lead => `
    <div class="admin-lead-item">
      <strong>${lead.name || lead.email}</strong><br>
      <small>${lead.email}</small><br>
      <small style="color: #94a3b8;">${new Date(lead.createdAt).toLocaleString()} · ${lead.type || 'demo'}</small>
    </div>
  `).join('');

  const html = `
    <div class="admin-header">
      <h3>📊 Admin Panel & Threat Intel</h3>
      <button id="closeAdminBtn" style="background:0;border:0;color:#60a5fa;cursor:pointer;font-size:1.5rem;">×</button>
    </div>

    <div class="admin-stats">
      <div class="stat"><strong>${leads.length}</strong><br><small>Total Leads</small></div>
      <div class="stat"><strong>${Object.keys(scammerIntelligence).length}</strong><br><small>Flagged Entities</small></div>
      <div class="stat"><strong>${leads.filter(l => l.type === 'demo').length}</strong><br><small>Demo Requests</small></div>
    </div>

    <div class="admin-section">
      <h4>Recent Leads</h4>
      ${leadsHtml || '<p style="color: #94a3b8;">No leads yet</p>'}
    </div>

    <div class="admin-actions">
      <button id="downloadJsonBtn" class="btn btn-primary">Export JSON</button>
      <button id="downloadCsvBtn" class="btn btn-ghost">Export CSV</button>
      <button id="clearLeadsBtn" class="btn btn-ghost">Clear All</button>
    </div>
  `;

  const adminPanel = document.getElementById('adminPanel');
  adminPanel.innerHTML = html;

  document.getElementById('closeAdminBtn').addEventListener('click', () => {
    adminPanel.classList.remove('active');
  });

  document.getElementById('downloadJsonBtn').addEventListener('click', () => {
    downloadFile(leadManager.exportAsJSON(), 'blockchain-monitor-leads.json', 'application/json');
  });

  document.getElementById('downloadCsvBtn').addEventListener('click', () => {
    downloadFile(leadManager.exportAsCSV(), 'blockchain-monitor-leads.csv', 'text/csv');
  });

  document.getElementById('clearLeadsBtn').addEventListener('click', () => {
    if (confirm('Are you sure? This cannot be undone.')) {
      localStorage.removeItem(leadManager.storageKey);
      leadManager.leads = [];
      showNotification('All leads cleared', 'success');
      renderAdminPanel();
    }
  });
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ========== INITIALIZATION ==========

window.addEventListener('DOMContentLoaded', () => {
  renderMetrics();
  renderSignals();
  renderAlerts();
  renderTxTable();
  renderScammerIntelPanel();
  renderChart();
  bindControls();

  initDemoForm();
  initContactForm();
  initPricingCTA();
  initAdminPanel();

  console.log('✅ Blockchain Monitor Pro & Indirect Exposure Tracking loaded successfully');
});
