// =============================================================
// IRONSCAN — Gym Equipment Categorizer
// script.js
// Handles: navbar toggle, drag-and-drop upload, image preview,
//          URL loading, mock analysis animation, results reveal
// =============================================================


// ─── ELEMENT REFERENCES ──────────────────────────────────────

const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobileMenu');

const dropZone    = document.getElementById('dropZone');
const fileInput   = document.getElementById('fileInput');
const dropDefault = document.getElementById('dropDefault');
const dropOverlay = document.getElementById('dropOverlay');

const previewPanel = document.getElementById('previewPanel');
const previewImg   = document.getElementById('previewImg');
const clearBtn     = document.getElementById('clearBtn');
const analyzeBtn   = document.getElementById('analyzeBtn');
const scanBar      = document.getElementById('scanBar');

const urlInput    = document.getElementById('urlInput');
const loadUrlBtn  = document.getElementById('loadUrlBtn');

const statusText  = document.getElementById('statusText');
const statusDot   = document.querySelector('.status-dot');

const valType     = document.getElementById('valType');
const valPrice    = document.getElementById('valPrice');
const valMaterial = document.getElementById('valMaterial');
const metaType    = document.getElementById('metaType');
const metaPrice   = document.getElementById('metaPrice');
const metaMaterial= document.getElementById('metaMaterial');
const badgeType   = document.getElementById('badgeType');
const badgePrice  = document.getElementById('badgePrice');
const badgeMaterial = document.getElementById('badgeMaterial');

const confidenceBlock = document.getElementById('confidenceBlock');
const confVal     = document.getElementById('confVal');
const confBar     = document.getElementById('confBar');

const cardType     = document.getElementById('cardType');
const cardPrice    = document.getElementById('cardPrice');
const cardMaterial = document.getElementById('cardMaterial');


// ─── PLACEHOLDER DATA ─────────────────────────────────────────
// These are the demo values shown once "Analyze" is clicked.
// In the future, these will be replaced by actual AI responses.

const PLACEHOLDER_RESULTS = {
  type: {
    value: "Adjustable Dumbbell",
    meta:  "Free weight / Strength",
    badge: "STRENGTH"
  },
  price: {
    value: "$120 – $180",
    meta:  "Retail market average",
    badge: "RETAIL"
  },
  material: {
    value: "Steel + Rubber",
    meta:  "Cast iron core, rubber coat",
    badge: "COMPOSITE"
  }
};


// ─── NAVBAR: Mobile hamburger toggle ─────────────────────────

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

// Close mobile menu when a link inside is clicked
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});


// ─── NAVBAR: Scroll shadow effect ────────────────────────────

window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 20) {
    navbar.style.borderBottomColor = 'rgba(255,255,255,0.1)';
  } else {
    navbar.style.borderBottomColor = 'rgba(255,255,255,0.07)';
  }
});


// ─── IMAGE LOADING HELPER ─────────────────────────────────────
// Called whenever we have a valid image source (file or URL)

function loadImagePreview(src) {
  previewImg.src = src;

  previewImg.onload = () => {
    // Hide upload zone, show preview panel
    dropZone.hidden    = true;
    previewPanel.hidden = false;

    // Reset results to "waiting" state
    resetResults();
  };

  previewImg.onerror = () => {
    alert('Could not load image. Please check the URL or try a different file.');
    previewImg.src = '';
  };
}


// ─── FILE INPUT: Click-to-upload ─────────────────────────────

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Make sure it's an image
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file (PNG, JPG, WEBP, etc.)');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => loadImagePreview(event.target.result);
  reader.readAsDataURL(file);
});

// Also allow clicking anywhere in the drop zone to trigger file picker
dropZone.addEventListener('click', (e) => {
  // Don't double-fire if clicking the label/button directly
  if (e.target === fileInput || e.target.closest('label')) return;
  if (e.target === loadUrlBtn || e.target === urlInput) return;
  fileInput.click();
});

// Keyboard accessibility for drop zone
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});


// ─── URL LOADING ─────────────────────────────────────────────

loadUrlBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (!url) return;

  // Basic URL validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    alert('Please enter a valid URL starting with http:// or https://');
    return;
  }

  loadImagePreview(url);
  urlInput.value = '';
});

// Allow pressing Enter in the URL input
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadUrlBtn.click();
});


// ─── DRAG AND DROP ───────────────────────────────────────────

// Prevent browser default behavior (opening the file in a new tab)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
  document.body.addEventListener(event, (e) => e.preventDefault());
});

// Show drag-over state
dropZone.addEventListener('dragenter', () => dropZone.classList.add('dragover'));
dropZone.addEventListener('dragover',  () => dropZone.classList.add('dragover'));

// Remove drag-over state
dropZone.addEventListener('dragleave', (e) => {
  // Only remove if we're leaving the drop zone itself (not a child)
  if (!dropZone.contains(e.relatedTarget)) {
    dropZone.classList.remove('dragover');
  }
});

// Handle file drop
dropZone.addEventListener('drop', (e) => {
  dropZone.classList.remove('dragover');

  const files = e.dataTransfer.files;
  if (!files.length) return;

  const file = files[0];
  if (!file.type.startsWith('image/')) {
    alert('Please drop an image file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => loadImagePreview(event.target.result);
  reader.readAsDataURL(file);
});


// ─── CLEAR / REMOVE IMAGE ────────────────────────────────────

clearBtn.addEventListener('click', () => {
  previewImg.src       = '';
  previewPanel.hidden  = true;
  dropZone.hidden      = false;
  fileInput.value      = '';
  scanBar.classList.remove('active');
  resetResults();
});


// ─── RESET RESULTS PANEL ─────────────────────────────────────
// Puts the results panel back to its empty/waiting state

function resetResults() {
  // Status
  statusDot.className  = 'status-dot waiting';
  statusText.textContent = 'Waiting for image…';

  // Card values
  valType.textContent     = '—';
  valPrice.textContent    = '—';
  valMaterial.textContent = '—';
  metaType.textContent    = 'Upload an image to identify';
  metaPrice.textContent   = 'Retail market average';
  metaMaterial.textContent = 'Composition detected';

  // Remove populated class
  [cardType, cardPrice, cardMaterial].forEach(c => c.classList.remove('populated'));

  // Badges
  badgeType.style.display     = '';
  badgePrice.style.display    = '';
  badgeMaterial.style.display = '';
  badgeType.textContent     = '';
  badgePrice.textContent    = '';
  badgeMaterial.textContent = '';

  // Confidence bar
  confidenceBlock.hidden = true;
  confVal.textContent    = '0%';
  confBar.style.width    = '0%';

  // Enable analyze button
  analyzeBtn.disabled = false;
  analyzeBtn.textContent = '';
  analyzeBtn.innerHTML = `
    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    Analyze Equipment
  `;
}


// ─── ANALYSIS ────────────────────────────────────────────────
// Converts the preview image to base64, sends it to Flask /analyze,
// then displays the real Roboflow results.

analyzeBtn.addEventListener('click', async () => {
  if (!previewImg.src) return;

  // Disable button and show spinner
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = `
    <svg class="spin" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 1 1-9-9"/>
    </svg>
    Analyzing…
  `;

  const style = document.getElementById('spin-style') || document.createElement('style');
  style.id = 'spin-style';
  style.textContent = '.spin { animation: spinIcon 0.8s linear infinite; } @keyframes spinIcon { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);

  scanBar.classList.add('active');
  statusDot.className    = 'status-dot scanning';
  statusText.textContent = 'Scanning image…';

  try {
    // Convert the displayed image to a base64 data URL
    const canvas  = document.createElement('canvas');
    canvas.width  = previewImg.naturalWidth;
    canvas.height = previewImg.naturalHeight;
    canvas.getContext('2d').drawImage(previewImg, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    statusText.textContent = 'Sending to Roboflow…';

    const response = await fetch('/analyze', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ image: imageData })
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

    statusDot.className    = 'status-dot done';
    statusText.textContent = 'Analysis complete';

    // Reveal results with real data from Roboflow
    revealResult(cardType, valType, metaType, badgeType,
      result.type.value, result.type.meta, result.type.badge, 0);

    revealResult(cardPrice, valPrice, metaPrice, badgePrice,
      result.price.value, result.price.meta, result.price.badge, 150);

    revealResult(cardMaterial, valMaterial, metaMaterial, badgeMaterial,
      result.material.value, result.material.meta, result.material.badge, 300);

    // Animate confidence bar with real confidence score
    setTimeout(() => {
      confidenceBlock.hidden = false;
      const targetPct = result.confidence;
      let current = 0;
      const interval = setInterval(() => {
        current += 2;
        if (current >= targetPct) { current = targetPct; clearInterval(interval); }
        confVal.textContent = current + '%';
        confBar.style.width = current + '%';
      }, 16);
    }, 400);

  } catch (err) {
    scanBar.classList.remove('active');
    statusDot.className    = 'status-dot waiting';
    statusText.textContent = 'Could not reach server';
  }

  analyzeBtn.disabled = false;
  analyzeBtn.innerHTML = `
    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    Re-Analyze
  `;
});


// ─── RESULT REVEAL HELPER ────────────────────────────────────
// Animates a single result card appearing with its values

function revealResult(card, valEl, metaEl, badgeEl, value, meta, badge, delay) {
  setTimeout(() => {
    valEl.textContent   = value;
    metaEl.textContent  = meta;
    badgeEl.textContent = badge;
    card.classList.add('populated');

    // Quick flash animation
    card.style.transition = 'border-color 0.3s ease, transform 0.3s ease, background 0.3s ease';
    card.style.background = 'rgba(0,209,255,0.06)';
    setTimeout(() => { card.style.background = ''; }, 600);
  }, delay);
}


// ─── SMOOTH SCROLL for nav links ─────────────────────────────
// Makes all anchor links scroll smoothly (already handled by CSS
// scroll-behavior: smooth, but this adds offset for fixed navbar)

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();

    const offset = 72; // navbar height
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


// ─── SCROLL REVEAL ───────────────────────────────────────────
// Adds a subtle fade-in as sections scroll into view

const revealTargets = document.querySelectorAll(
  '.step-card, .result-card, .tech-list li, .footer-col'
);

// Add initial hidden state
revealTargets.forEach(el => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(16px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealTargets.forEach(el => revealObserver.observe(el));