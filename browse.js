// browse.js — Equipment catalog with search + filter

document.getElementById('hamburger').addEventListener('click', () =>
  document.getElementById('mobileMenu').classList.toggle('open')
);

const EQUIPMENT = [
  { name: 'Barbell', category: 'Free Weights', icon: '🏋️', avgPrice: '$80 – $200', desc: 'Standard Olympic barbell for compound lifts like squat, deadlift, and bench press.' },
  { name: 'Dumbbell Set', category: 'Free Weights', icon: '💪', avgPrice: '$1 – $3 per lb', desc: 'Adjustable or fixed weight dumbbells for isolation and compound movements.' },
  { name: 'Kettlebell', category: 'Free Weights', icon: '🔔', avgPrice: '$1 – $2 per lb', desc: 'Cast iron bell for dynamic training including swings, snatches, and Turkish get-ups.' },
  { name: 'Medicine Ball', category: 'Free Weights', icon: '⚽', avgPrice: '$20 – $80', desc: 'Weighted ball for functional training, slams, and core exercises.' },
  { name: 'EZ Curl Bar', category: 'Free Weights', icon: '〰️', avgPrice: '$30 – $80', desc: 'Angled barbell for bicep curls and tricep extensions with reduced wrist strain.' },
  { name: 'Weight Plates', category: 'Free Weights', icon: '🔘', avgPrice: '$0.50 – $1 per lb', desc: 'Olympic or standard weight plates for barbells and plate-loaded machines.' },

  { name: 'Treadmill', category: 'Cardio', icon: '🏃', avgPrice: '$200 – $1,500', desc: 'Electric or manual running machine for cardio and interval training.' },
  { name: 'Stationary Bike', category: 'Cardio', icon: '🚴', avgPrice: '$100 – $800', desc: 'Upright, spin, or recumbent bike for low-impact cardiovascular training.' },
  { name: 'Rowing Machine', category: 'Cardio', icon: '🚣', avgPrice: '$200 – $1,200', desc: 'Air, magnetic, or water resistance rower for full-body cardio.' },
  { name: 'Elliptical', category: 'Cardio', icon: '🌀', avgPrice: '$200 – $1,000', desc: 'Low-impact cardio machine that mimics running without joint stress.' },
  { name: 'Stair Climber', category: 'Cardio', icon: '🪜', avgPrice: '$300 – $1,500', desc: 'Simulates stair climbing for intense lower-body cardio conditioning.' },
  { name: 'Jump Rope', category: 'Cardio', icon: '🪢', avgPrice: '$10 – $40', desc: 'Portable high-intensity cardio tool for speed, agility, and endurance.' },

  { name: 'Power Rack', category: 'Machines', icon: '🏗️', avgPrice: '$300 – $1,200', desc: 'Safety cage for squats, bench press, and pull-ups with adjustable safeties.' },
  { name: 'Smith Machine', category: 'Machines', icon: '🔩', avgPrice: '$400 – $1,800', desc: 'Guided barbell on vertical rails for safe solo lifting.' },
  { name: 'Cable Machine', category: 'Machines', icon: '🔗', avgPrice: '$400 – $2,000', desc: 'Functional trainer with adjustable cable pulley system for full-body exercises.' },
  { name: 'Lat Pulldown', category: 'Machines', icon: '↕️', avgPrice: '$200 – $1,000', desc: 'Cable machine targeting the latissimus dorsi and biceps.' },
  { name: 'Leg Press', category: 'Machines', icon: '🦵', avgPrice: '$300 – $1,500', desc: 'Plate-loaded or selectorized platform machine for quad, hamstring, and glute development.' },
  { name: 'Chest Press Machine', category: 'Machines', icon: '📐', avgPrice: '$200 – $900', desc: 'Selectorized or plate-loaded machine for chest and tricep training.' },
  { name: 'Hack Squat', category: 'Machines', icon: '🦿', avgPrice: '$400 – $1,500', desc: 'Angled sled machine for quad-focused squat movements.' },
  { name: 'Functional Trainer', category: 'Machines', icon: '⚙️', avgPrice: '$500 – $2,500', desc: 'Dual cable system with adjustable pulleys for sport-specific movement patterns.' },

  { name: 'Pull-up Bar', category: 'Accessories', icon: '🔝', avgPrice: '$20 – $120', desc: 'Doorframe or wall-mounted bar for pull-ups, chin-ups, and hanging exercises.' },
  { name: 'Resistance Bands', category: 'Accessories', icon: '🎀', avgPrice: '$15 – $60', desc: 'Latex or fabric bands for resistance training, mobility work, and rehab.' },
  { name: 'Battle Ropes', category: 'Accessories', icon: '🪱', avgPrice: '$60 – $200', desc: 'Thick nylon ropes for high-intensity conditioning and upper body endurance.' },
  { name: 'Gymnastics Rings', category: 'Accessories', icon: '🤸', avgPrice: '$30 – $80', desc: 'Wooden or plastic rings for bodyweight strength training and gymnastics.' },
  { name: 'Dip Station', category: 'Accessories', icon: '🅿️', avgPrice: '$50 – $200', desc: 'Parallel bars for tricep dips, leg raises, and bodyweight pressing.' },
  { name: 'Yoga Mat', category: 'Accessories', icon: '🧘', avgPrice: '$20 – $100', desc: 'Non-slip cushioned mat for floor exercises, yoga, and stretching.' },
  { name: 'Weight Belt', category: 'Accessories', icon: '🪖', avgPrice: '$30 – $120', desc: 'Leather or nylon belt for core support during heavy compound lifts.' },
  { name: 'Lifting Straps', category: 'Accessories', icon: '🤜', avgPrice: '$10 – $40', desc: 'Wrist straps to improve grip during deadlifts, rows, and pull-downs.' },

  { name: 'Foam Roller', category: 'Recovery', icon: '🛁', avgPrice: '$15 – $60', desc: 'Self-myofascial release tool for muscle recovery and flexibility.' },
  { name: 'Massage Gun', category: 'Recovery', icon: '🔫', avgPrice: '$50 – $300', desc: 'Percussive therapy device for deep tissue muscle recovery.' },
  { name: 'Ice Bath / Cold Plunge', category: 'Recovery', icon: '🧊', avgPrice: '$100 – $600', desc: 'Cold water immersion for inflammation reduction and recovery acceleration.' },
  { name: 'Stretching Strap', category: 'Recovery', icon: '🪢', avgPrice: '$10 – $30', desc: 'Multi-loop strap for assisted stretching and flexibility training.' },
];

let currentCategory = 'All';
const grid = document.getElementById('equipmentGrid');
const searchInput = document.getElementById('searchInput');

function renderGrid() {
  const query = searchInput.value.toLowerCase().trim();
  const filtered = EQUIPMENT.filter(e => {
    const matchCat = currentCategory === 'All' || e.category === currentCategory;
    const matchQ   = !query || e.name.toLowerCase().includes(query) || e.desc.toLowerCase().includes(query);
    return matchCat && matchQ;
  });

  if (!filtered.length) {
    grid.innerHTML = '<div class="no-results">No equipment found. Try a different search or category.</div>';
    return;
  }

  grid.innerHTML = filtered.map(e => {
    const ebayQ = encodeURIComponent(`${e.name} gym equipment used`);
    const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${ebayQ}&LH_ItemCondition=3000`;
    return `
      <div class="equip-card">
        <div class="equip-card-icon">${e.icon}</div>
        <div>
          <div class="equip-card-cat">${e.category}</div>
          <div class="equip-card-name">${e.name}</div>
        </div>
        <div class="equip-card-desc">${e.desc}</div>
        <div class="equip-card-price">${e.avgPrice}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <a href="/" class="btn-primary" style="flex:1;justify-content:center;font-size:12px;padding:9px 12px">
            Scan This
          </a>
          <a href="${ebayUrl}" target="_blank" rel="noopener noreferrer"
             style="flex:1;justify-content:center;display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-2);transition:color 0.2s,border-color 0.2s;"
             onmouseover="this.style.color='var(--indigo-lite)';this.style.borderColor='var(--border-acc)'"
             onmouseout="this.style.color='var(--text-2)';this.style.borderColor='var(--border)'">
            eBay →
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// Filter tabs
document.getElementById('filterTabs').addEventListener('click', e => {
  const tab = e.target.closest('.filter-tab');
  if (!tab) return;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  currentCategory = tab.dataset.cat;
  renderGrid();
});

// Search
searchInput.addEventListener('input', renderGrid);

// Init
renderGrid();
