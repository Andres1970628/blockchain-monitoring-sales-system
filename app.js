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

const chartSeries = {
  '1H': [16, 22, 18, 28, 34, 36, 42, 48, 52, 58, 64, 70],
  '24H': [10, 16, 18, 25, 31, 36, 40, 45, 48, 56, 63, 78],
  '7D': [8, 14, 18, 22, 30, 36, 42, 46, 54, 60, 70, 82],
  '30D': [5, 9, 13, 18, 22, 29, 34, 41, 48, 57, 69, 84]
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

  el.innerHTML = txData.map(row => `
    <tr>
      <td><span class="network-tag">${row.net}</span></td>
      <td class="tx-hash">${row.hash}</td>
      <td>${row.type}</td>
      <td>${row.amount}</td>
      <td>${row.fee}</td>
      <td><span class="status-tag ${statusMap[row.status] || 'confirmed'}">${row.status}</span></td>
    </tr>
  `).join('');
}

function renderChart() {
  const el = document.getElementById('mainChart');
  if (!el) return;

  const labels = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
  const data = chartSeries[state.range] || chartSeries['1H'];

  if (mainChart) mainChart.destroy();

  mainChart = new Chart(el, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Flow',
        data,
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96, 165, 250, 0.12)',
        borderWidth: 2,
        fill: true,
        tension: 0.42,
        pointRadius: 0,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(9, 12, 24, 0.96)',
          borderColor: 'rgba(148,163,184,0.18)',
          borderWidth: 1,
          titleColor: '#e2e8f0',
          bodyColor: '#cbd5e1'
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
        y: { grid: { color: 'rgba(148,163,184,0.12)' }, ticks: { color: '#94a3b8' } }
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

window.addEventListener('DOMContentLoaded', () => {
  renderMetrics();
  renderSignals();
  renderAlerts();
  renderTxTable();
  renderChart();
  bindControls();
});
