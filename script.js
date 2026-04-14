// =============================================================
// IRONSCAN — script.js
// Scanner, all detections, listing generator, history save
// =============================================================

// ─── ELEMENT REFERENCES ──────────────────────────────────────
const hamburger    = document.getElementById('hamburger');
const mobileMenu   = document.getElementById('mobileMenu');
const dropZone     = document.getElementById('dropZone');
const fileInput    = document.getElementById('fileInput');
const dropDefault  = document.getElementById('dropDefault');
const dropOverlay  = document.getElementById('dropOverlay');
const previewPanel = document.getElementById('previewPanel');
const previewImg   = document.getElementById('previewImg');
const clearBtn     = document.getElementById('clearBtn');
const analyzeBtn   = document.getElementById('analyzeBtn');
const scanBar      = document.getElementById('scanBar');
const urlInput     = document.getElementById('urlInput');
const loadUrlBtn   = document.getElementById('loadUrlBtn');
const statusText   = document.getElementById('statusText');
const statusDot    = document.querySelector('.status-dot');

const valType      = document.getElementById('valType');
const valPrice     = document.getElementById('valPrice');
const valMaterial  = document.getElementById('valMaterial');
const metaType     = document.getElementById('metaType');
const metaPrice    = document.getElementById('metaPrice');
const metaMaterial = document.getElementById('metaMaterial');
const badgeType    = document.getElementById('badgeType');
const badgePrice   = document.getElementById('badgePrice');
const badgeMaterial= document.getElementById('badgeMaterial');
const cardType     = document.getElementById('cardType');
const cardPrice    = document.getElementById('cardPrice');
const cardMaterial = document.getElementById('cardMaterial');
const ebayLink     = document.getElementById('ebayLink');

const confidenceBlock  = document.getElementById('confidenceBlock');
const confVal          = document.getElementById('confVal');
const confBar          = document.getElementById('confBar');

const allDetections    = document.getElementById('allDetections');
const detectionChips   = document.getElementById('detectionChips');

const btnListing       = document.getElementById('btnListing');
const listingPanel     = document.getElementById('listingPanel');
const closeListingBtn  = document.getElementById('closeListingBtn');
const listingFields    = document.getElementById('listingFields');
const listingActions      = document.getElementById('listingActions');
const listingEbayBtn      = document.getElementById('listingEbayBtn');
const listingPhotoPreview = document.getElementById('listingPhotoPreview');
const listingPhoto        = document.getElementById('listingPhoto');
const listingPhotoLabel   = document.getElementById('listingPhotoLabel');

// State
let currentResult = null;
let currentImageData = null;

// ─── NAVBAR ──────────────────────────────────────────────────
hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu.querySelectorAll('a').forEach(l => l.addEventListener('click', () => mobileMenu.classList.remove('open')));

window.addEventListener('scroll', () => {
  document.querySelector('.navbar').style.borderBottomColor =
    window.scrollY > 20 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.07)';
});

// ─── IMAGE LOADING ────────────────────────────────────────────
function loadImagePreview(src) {
  previewImg.src = src;
  previewImg.onload = () => {
    dropZone.hidden    = true;
    previewPanel.hidden = false;
    resetResults();
  };
  previewImg.onerror = () => {
    alert('Could not load image. Check the URL or try a different file.');
    previewImg.src = '';
  };
}

// ─── FILE INPUT ───────────────────────────────────────────────
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    currentImageData = ev.target.result;
    loadImagePreview(ev.target.result);
  };
  reader.readAsDataURL(file);
});

dropZone.addEventListener('click', e => {
  if (e.target === fileInput || e.target.closest('label')) return;
  if (e.target === loadUrlBtn || e.target === urlInput) return;
  fileInput.click();
});

dropZone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

// ─── URL LOADING ─────────────────────────────────────────────
loadUrlBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (!url) return;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    alert('Please enter a valid URL starting with http:// or https://');
    return;
  }
  currentImageData = url;
  loadImagePreview(url);
  urlInput.value = '';
});
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadUrlBtn.click(); });

// ─── DRAG AND DROP ────────────────────────────────────────────
['dragenter','dragover','dragleave','drop'].forEach(ev =>
  document.body.addEventListener(ev, e => e.preventDefault())
);
dropZone.addEventListener('dragenter', () => dropZone.classList.add('dragover'));
dropZone.addEventListener('dragover',  () => dropZone.classList.add('dragover'));
dropZone.addEventListener('dragleave', e => {
  if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', e => {
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) { alert('Please drop an image file.'); return; }
  const reader = new FileReader();
  reader.onload = ev => { currentImageData = ev.target.result; loadImagePreview(ev.target.result); };
  reader.readAsDataURL(file);
});

// ─── CLEAR ────────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  previewImg.src      = '';
  previewPanel.hidden = true;
  dropZone.hidden     = false;
  fileInput.value     = '';
  currentImageData    = null;
  currentResult       = null;
  scanBar.classList.remove('active');
  resetResults();
});

// ─── RESET RESULTS ────────────────────────────────────────────
function resetResults() {
  statusDot.className    = 'status-dot waiting';
  statusText.textContent = 'Waiting for image…';

  valType.textContent     = '—';
  valPrice.textContent    = '—';
  valMaterial.textContent = '—';
  metaType.textContent    = 'Upload an image to identify';
  metaPrice.textContent   = 'eBay / FB Marketplace';
  metaMaterial.textContent= 'AI-generated summary';

  [cardType, cardPrice, cardMaterial].forEach(c => c.classList.remove('populated'));
  badgeType.style.display = badgePrice.style.display = badgeMaterial.style.display = '';
  badgeType.textContent = badgePrice.textContent = badgeMaterial.textContent = '';
  ebayLink.style.display = 'none';
  ebayLink.href = '#';

  confidenceBlock.hidden = true;
  confVal.textContent = '0%';
  confBar.style.width = '0%';

  allDetections.style.display = 'none';
  detectionChips.innerHTML = '';

  btnListing.classList.remove('visible');
  listingPanel.classList.remove('open');

  analyzeBtn.disabled = false;
  analyzeBtn.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    Analyze Equipment
  `;
}

// ─── ANALYZE ──────────────────────────────────────────────────
analyzeBtn.addEventListener('click', async () => {
  if (!previewImg.src) return;

  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = `
    <svg class="spin" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 1 1-9-9"/>
    </svg>
    Analyzing…
  `;

  const spinStyle = document.getElementById('spin-style') || document.createElement('style');
  spinStyle.id = 'spin-style';
  spinStyle.textContent = '.spin{animation:spinIcon 0.8s linear infinite}@keyframes spinIcon{to{transform:rotate(360deg)}}';
  document.head.appendChild(spinStyle);

  scanBar.classList.add('active');
  statusDot.className    = 'status-dot scanning';
  statusText.textContent = 'Scanning image…';

  try {
    const canvas  = document.createElement('canvas');
    canvas.width  = previewImg.naturalWidth;
    canvas.height = previewImg.naturalHeight;
    canvas.getContext('2d').drawImage(previewImg, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    statusText.textContent = 'Sending to AI…';

    const response = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });

    const result = await response.json();
    scanBar.classList.remove('active');

    if (!response.ok || result.error) {
      statusDot.className    = 'status-dot waiting';
      statusText.textContent = result.error || 'Analysis failed';
      analyzeBtn.disabled    = false;
      analyzeBtn.innerHTML   = 'Try Again';
      return;
    }

    currentResult = result;

    statusDot.className    = 'status-dot done';
    statusText.textContent = 'Analysis complete';

    revealResult(cardType, valType, metaType, badgeType,
      result.type.value, result.type.meta, result.type.badge, 0);

    revealResult(cardPrice, valPrice, metaPrice, badgePrice,
      result.price.value, result.price.meta, result.price.badge, 120);

    revealResult(cardMaterial, valMaterial, metaMaterial, badgeMaterial,
      result.material.value, result.material.meta, result.material.badge, 240);

    // eBay link
    if (result.ebay_url) {
      setTimeout(() => {
        ebayLink.href          = result.ebay_url;
        ebayLink.style.display = 'inline-flex';
      }, 160);
    }

    // All detections chips (skip top one)
    const others = (result.all_detections || []).slice(1);
    if (others.length) {
      setTimeout(() => {
        detectionChips.innerHTML = others.map(d => `
          <span class="detection-chip">
            ${d.label}
            <span class="chip-conf">${d.confidence}%</span>
          </span>
        `).join('');
        allDetections.style.display = 'block';
      }, 300);
    }

    // Confidence bar
    setTimeout(() => {
      confidenceBlock.hidden = false;
      const target = result.confidence;
      let cur = 0;
      const iv = setInterval(() => {
        cur += 2;
        if (cur >= target) { cur = target; clearInterval(iv); }
        confVal.textContent = cur + '%';
        confBar.style.width = cur + '%';
      }, 16);
    }, 360);

    // Show listing button
    setTimeout(() => btnListing.classList.add('visible'), 480);

    // Save to history
    saveToHistory(result, imageData);

  } catch (err) {
    scanBar.classList.remove('active');
    statusDot.className    = 'status-dot waiting';
    statusText.textContent = 'Could not reach server';
    console.error(err);
  }

  analyzeBtn.disabled = false;
  analyzeBtn.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    Re-Analyze
  `;
});

// ─── REVEAL RESULT ────────────────────────────────────────────
function revealResult(card, valEl, metaEl, badgeEl, value, meta, badge, delay) {
  setTimeout(() => {
    valEl.textContent   = value;
    metaEl.textContent  = meta;
    badgeEl.textContent = badge;
    card.classList.add('populated');
    card.style.transition = 'border-color 0.3s ease, background 0.3s ease';
    card.style.background = card.id === 'cardPrice'
      ? 'rgba(34,197,94,0.04)' : 'rgba(99,102,241,0.04)';
    setTimeout(() => { card.style.background = ''; }, 500);
  }, delay);
}

// ─── LISTING GENERATOR ────────────────────────────────────────
btnListing.addEventListener('click', async () => {
  if (!currentResult) return;
  listingPanel.classList.add('open');
  listingActions.style.display = 'none';
  listingFields.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-3);font-size:13px">Generating listing…</div>';

  // Show photo preview
  if (currentImageData) {
    listingPhoto.src = currentImageData;
    listingPhotoLabel.textContent = currentResult.type.value;
    listingPhotoPreview.style.display = 'block';
  } else {
    listingPhotoPreview.style.display = 'none';
  }

  try {
    const resp = await fetch('/generate-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: currentResult.type.value,
        price: currentResult.price.value
      })
    });
    const listing = await resp.json();

    if (listing.error) throw new Error(listing.error);

    listingFields.innerHTML = `
      <div class="listing-field">
        <label>Title</label>
        <div class="listing-field-row">
          <textarea class="listing-field-value single" rows="1" id="listingTitle" readonly>${listing.title || ''}</textarea>
          <button class="btn-copy" onclick="copyField('listingTitle', this)">Copy</button>
        </div>
      </div>
      <div class="listing-field">
        <label>Suggested Price</label>
        <div class="listing-field-row">
          <textarea class="listing-field-value single" rows="1" id="listingPrice" readonly>${listing.price || currentResult.price.value}</textarea>
          <button class="btn-copy" onclick="copyField('listingPrice', this)">Copy</button>
        </div>
      </div>
      <div class="listing-field">
        <label>Description</label>
        <div class="listing-field-row">
          <textarea class="listing-field-value" id="listingDesc" readonly>${listing.description || ''}</textarea>
          <button class="btn-copy" onclick="copyField('listingDesc', this)">Copy</button>
        </div>
      </div>
    `;

    // Wire eBay post button
    if (currentResult.ebay_url) {
      listingEbayBtn.href = currentResult.ebay_url;
    }
    listingActions.style.display = 'flex';

  } catch (e) {
    listingFields.innerHTML = `<div style="padding:16px;color:var(--red);font-size:13px">Error: ${e.message}</div>`;
  }
});

closeListingBtn.addEventListener('click', () => {
  listingPanel.classList.remove('open');
  listingPhotoPreview.style.display = 'none';
});

function copyField(id, btn) {
  const el = document.getElementById(id);
  navigator.clipboard.writeText(el.value).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1800);
  });
}

// ─── HISTORY SAVE ─────────────────────────────────────────────
function saveToHistory(result, imageData) {
  try {
    const history = JSON.parse(localStorage.getItem('ironscan_history') || '[]');
    history.unshift({
      id:         Date.now(),
      date:       new Date().toISOString(),
      type:       result.type.value,
      price:      result.price.value,
      blurb:      result.material.value,
      confidence: result.confidence,
      ebay_url:   result.ebay_url,
      image:      imageData
    });
    // Keep last 50
    localStorage.setItem('ironscan_history', JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.warn('Could not save to history:', e);
  }
}

// ─── SMOOTH SCROLL ────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
  });
});

// ─── SCROLL REVEAL ────────────────────────────────────────────
const revealTargets = document.querySelectorAll('.step-card, .result-card, .tech-list li, .footer-col');
revealTargets.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(14px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});
new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 }).observe
? (() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });
    revealTargets.forEach(el => obs.observe(el));
  })()
: revealTargets.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
