// compare.js — Side-by-side equipment comparison

document.getElementById('hamburger').addEventListener('click', () =>
  document.getElementById('mobileMenu').classList.toggle('open')
);

const slots = ['A', 'B'];
const state = { A: null, B: null };

slots.forEach(side => {
  const fileInput  = document.getElementById(`file${side}`);
  const drop       = document.getElementById(`drop${side}`);
  const previewDiv = document.getElementById(`preview${side}`);
  const img        = document.getElementById(`img${side}`);
  const btn        = document.getElementById(`analyze${side}`);

  // File pick
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => loadSlot(side, ev.target.result);
    reader.readAsDataURL(file);
  });

  // Click on drop zone
  drop.addEventListener('click', e => {
    if (e.target.closest('label') || e.target === fileInput) return;
    fileInput.click();
  });

  // Drag & drop
  ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.style.borderColor = 'var(--indigo)';
  }));
  ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.style.borderColor = '';
  }));
  drop.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => loadSlot(side, ev.target.result);
    reader.readAsDataURL(file);
  });

  // Analyze button
  btn.addEventListener('click', () => analyzeSlot(side));
});

function loadSlot(side, dataUrl) {
  const drop    = document.getElementById(`drop${side}`);
  const preview = document.getElementById(`preview${side}`);
  const img     = document.getElementById(`img${side}`);
  const btn     = document.getElementById(`analyze${side}`);
  const result  = document.getElementById(`result${side}`);

  img.src = dataUrl;
  drop.style.display    = 'none';
  preview.style.display = 'block';
  result.style.display  = 'none';
  btn.disabled = false;
  state[side] = { imageData: dataUrl, result: null };
}

async function analyzeSlot(side) {
  const btn = document.getElementById(`analyze${side}`);
  if (!state[side]) return;

  btn.disabled = true;
  btn.innerHTML = '<span style="opacity:0.6">Analyzing…</span>';

  // Strip prefix for Roboflow
  let imageData = state[side].imageData;

  try {
    const resp = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });
    const result = await resp.json();

    if (result.error) throw new Error(result.error);

    state[side].result = result;
    showSlotResult(side, result);
    updateTable();

  } catch (e) {
    btn.disabled = false;
    btn.innerHTML = `Analyze ${side} — Error`;
    console.error(e);
  }
}

function showSlotResult(side, result) {
  const resultDiv = document.getElementById(`result${side}`);
  const typeEl    = document.getElementById(`type${side}`);
  const priceEl   = document.getElementById(`price${side}`);
  const btn       = document.getElementById(`analyze${side}`);

  typeEl.textContent  = result.type.value;
  priceEl.textContent = result.price.value;
  resultDiv.style.display = 'block';

  btn.disabled = false;
  btn.innerHTML = `
    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    Done — Re-analyze ${side}
  `;
}

function updateTable() {
  const rA = state.A && state.A.result;
  const rB = state.B && state.B.result;
  if (!rA && !rB) return;

  document.getElementById('compareTable').classList.add('visible');

  if (rA) {
    document.getElementById('headerA').textContent  = rA.type.value;
    document.getElementById('cTypeA').textContent   = rA.type.value;
    document.getElementById('cPriceA').textContent  = rA.price.value;
    document.getElementById('cBlurbA').textContent  = rA.material.value;
    document.getElementById('cConfA').textContent   = rA.confidence + '%';
    document.getElementById('cEbayA').innerHTML = rA.ebay_url
      ? `<a href="${rA.ebay_url}" target="_blank" style="color:var(--indigo-lite)">View listings →</a>` : '—';
  }

  if (rB) {
    document.getElementById('headerB').textContent  = rB.type.value;
    document.getElementById('cTypeB').textContent   = rB.type.value;
    document.getElementById('cPriceB').textContent  = rB.price.value;
    document.getElementById('cBlurbB').textContent  = rB.material.value;
    document.getElementById('cConfB').textContent   = rB.confidence + '%';
    document.getElementById('cEbayB').innerHTML = rB.ebay_url
      ? `<a href="${rB.ebay_url}" target="_blank" style="color:var(--indigo-lite)">View listings →</a>` : '—';
  }

  // Highlight lower price as winner
  if (rA && rB) {
    const parsePrice = str => {
      const nums = (str || '').match(/\d+/g);
      if (!nums) return Infinity;
      return nums.map(Number).reduce((a,b) => a+b, 0) / nums.length;
    };
    const pA = parsePrice(rA.price.value);
    const pB = parsePrice(rB.price.value);
    const cellA = document.getElementById('cPriceA');
    const cellB = document.getElementById('cPriceB');
    cellA.classList.remove('winner');
    cellB.classList.remove('winner');
    if (pA !== Infinity && pB !== Infinity) {
      if (pA < pB) cellA.classList.add('winner');
      else if (pB < pA) cellB.classList.add('winner');
    }
  }
}
