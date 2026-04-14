// history.js — Scan history page

const historyGrid     = document.getElementById('historyGrid');
const historyCount    = document.getElementById('historyCount');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const hamburger       = document.getElementById('hamburger');
const mobileMenu      = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));

function getHistory() {
  try { return JSON.parse(localStorage.getItem('ironscan_history') || '[]'); }
  catch { return []; }
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function renderHistory() {
  const history = getHistory();
  historyCount.textContent = history.length
    ? `${history.length} scan${history.length === 1 ? '' : 's'}`
    : '0 scans';

  if (!history.length) {
    historyGrid.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon">📷</div>
        <h3>No scans yet</h3>
        <p>Head to the scanner to analyze your first piece of equipment.</p>
        <a href="/" class="btn-primary" style="margin-top:20px;display:inline-flex;align-items:center;gap:8px">
          Start Scanning
        </a>
      </div>
    `;
    return;
  }

  historyGrid.innerHTML = history.map(item => `
    <div class="history-card">
      ${item.image
        ? `<img class="history-card-img" src="${item.image}" alt="${item.type}" loading="lazy">`
        : `<div class="history-card-img-placeholder">🏋️</div>`
      }
      <div class="history-card-body">
        <div class="history-card-type">${item.type || 'Unknown'}</div>
        <div class="history-card-price">${item.price || '—'}</div>
        <div class="history-card-blurb">${item.blurb || ''}</div>
        <div class="history-card-meta">
          <span>${formatDate(item.date)}</span>
          <span class="history-conf">${item.confidence || 0}% confidence</span>
        </div>
        ${item.ebay_url
          ? `<a href="${item.ebay_url}" target="_blank" rel="noopener noreferrer"
               style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;font-weight:600;color:var(--indigo-lite);background:var(--indigo-dim);padding:5px 10px;border-radius:4px;">
               View on eBay →
             </a>`
          : ''
        }
      </div>
    </div>
  `).join('');
}

clearHistoryBtn.addEventListener('click', () => {
  if (!confirm('Clear all scan history? This cannot be undone.')) return;
  localStorage.removeItem('ironscan_history');
  renderHistory();
});

renderHistory();
