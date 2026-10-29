/* ==========================================================
   RoseCat Vintage — sample site interactions
   ========================================================== */

// TODO: replace with your real shop URLs. Individual pieces can also
// override these with their own `etsy` / `ebay` listing links.
const SHOP = {
  etsy: 'https://www.etsy.com/shop/RoseCatVintage',
  ebay: 'https://www.ebay.com/str/rosecatvintage',
};

const ERAS = [
  { id: 'all', name: 'All Eras', years: 'every decade', note: 'All the pieces in the case, from the 1830s to the 1970s.' },
  { id: 'victorian', name: 'Victorian', years: '1837–1901', note: 'Lots of sentiment: mourning lockets, garnet clusters, serpent rings and hand-carved cameos, mostly in warm yellow gold.' },
  { id: 'edwardian', name: 'Edwardian', years: '1901–1915', note: 'Light, lacy platinum filigree set with pearls and old-cut diamonds. The "garland style".' },
  { id: 'deco', name: 'Art Deco', years: '1920–1935', note: 'Geometry and contrast. Calibré-cut sapphires, emeralds and onyx set in crisp white metals.' },
  { id: 'retro', name: 'Retro', years: '1935–1950', note: 'Big Hollywood glamour in rose and yellow gold. Bows, scrolls and oversized cocktail stones.' },
  { id: 'mid', name: 'Mid-Century', years: '1950–1970', note: 'Playful charm bracelets, atomic brooches, turquoise, and lots of texture.' },
];

const TYPES = [
  { id: 'all', name: 'Everything' },
  { id: 'ring', name: 'Rings' },
  { id: 'pendant', name: 'Necklaces' },
  { id: 'brooch', name: 'Brooches' },
  { id: 'earrings', name: 'Earrings' },
  { id: 'bracelet', name: 'Bracelets' },
];

// Sample inventory. Images are drawn as SVG illustrations until real photos are added.
const PRODUCTS = [
  { id: 1, name: 'Victorian Garnet Cluster Ring', type: 'ring', era: 'victorian', metal: 'gold', metalName: '14k yellow gold', stone: 'garnet', stoneName: 'Bohemian garnet', color: '#7a1f2b', halo: true, price: 425, size: 'US 6¼ (resizable)', desc: 'A rosette of deep red Bohemian garnets around a larger center stone. The gallery is hand-pierced and still crisp after more than a century.' },
  { id: 2, name: 'Edwardian Pearl Lavalier', type: 'pendant', era: 'edwardian', metal: 'gold', metalName: '15k gold', stone: 'pearl', stoneName: 'natural seed & drop pearl', color: '#f1e9dc', price: 560, size: '17" chain', desc: 'A dainty lavalier with a natural pearl drop that sways as you move. Perfect for a wedding or for everyday wear.' },
  { id: 3, name: 'Art Deco Sapphire Ring', type: 'ring', era: 'deco', metal: 'silver', metalName: 'platinum', stone: 'sapphire', stoneName: 'cornflower sapphire', color: '#24479a', halo: true, price: 890, size: 'US 5½', desc: 'A cornflower-blue sapphire in a halo of tiny white stones, with milgrain edges and engraved shoulders.' },
  { id: 4, name: 'Shell Cameo Rose Pendant', type: 'pendant', era: 'victorian', metal: 'gold', metalName: '10k gold', stone: 'cameo', stoneName: 'carved shell cameo', color: '#efc3b6', cameo: true, price: 340, size: '1¼" frame', sold: true, desc: 'A hand-carved shell cameo of a full-blown rose. It is the piece our cat wears in the logo.' },
  { id: 5, name: 'Retro Citrine Cocktail Ring', type: 'ring', era: 'retro', metal: 'rose', metalName: '14k rose gold', stone: 'citrine', stoneName: 'Madeira citrine', color: '#e0a02a', price: 380, size: 'US 7', desc: 'A large honey-colored citrine set in a scrolled rose-gold mount.' },
  { id: 6, name: 'Turquoise Blossom Brooch', type: 'brooch', era: 'mid', metal: 'silver', metalName: 'sterling silver', stone: 'turquoise', stoneName: 'Sleeping Beauty turquoise', color: '#3fb3a6', price: 210, size: '1¾" across', desc: 'Petals of robin\'s-egg turquoise around a center cabochon, made in the 1960s.' },
  { id: 7, name: 'Art Deco Emerald Drops', type: 'earrings', era: 'deco', metal: 'silver', metalName: '18k white gold', stone: 'emerald', stoneName: 'Colombian emerald', color: '#1d7a4f', price: 640, size: '1⅜" drop', desc: 'Long, swingy emerald teardrops with a geometric look made for a 1920s dance hall.' },
  { id: 8, name: 'Victorian Amethyst Bangle', type: 'bracelet', era: 'victorian', metal: 'gold', metalName: '14k gold', stone: 'amethyst', stoneName: 'Siberian amethyst', color: '#7b4a9e', bangle: true, price: 720, size: '6½" interior', desc: 'A hinged bangle with three graduated amethysts and hand-chased scrollwork on both sides.' },
  { id: 9, name: 'Edwardian Aquamarine Brooch', type: 'brooch', era: 'edwardian', metal: 'silver', metalName: 'platinum-topped gold', stone: 'aquamarine', stoneName: 'aquamarine', color: '#8ccfdd', price: 495, size: '1½" across', desc: 'Pale aquamarine wrapped in garland-style filigree. It can be worn as a brooch or turned into a pendant.' },
  { id: 10, name: 'Retro Ruby Teardrop Earrings', type: 'earrings', era: 'retro', metal: 'rose', metalName: '14k rose gold', stone: 'ruby', stoneName: 'synthetic ruby', color: '#a3122f', price: 455, size: '1¼" drop', desc: 'Ruby teardrops on rose-gold hooks, with a little 1940s Hollywood flair.' },
  { id: 11, name: 'Edwardian Opal Halo Ring', type: 'ring', era: 'edwardian', metal: 'gold', metalName: '18k gold', stone: 'opal', stoneName: 'Australian opal', color: '#d9d2ec', halo: true, price: 610, size: 'US 6', desc: 'An Australian opal that flashes green and violet, set in a halo of rose-cut diamonds.' },
  { id: 12, name: 'Peridot Charm Bracelet', type: 'bracelet', era: 'mid', metal: 'gold', metalName: '12k gold-filled', stone: 'peridot', stoneName: 'peridot', color: '#9cc23a', price: 290, size: '7¼" length', desc: 'A rolo-link chain hung with little peridot drops. Charms can be added on request.' },
];

const BIRTHSTONES = [
  { m: 'Jan', stone: 'garnet', name: 'Garnet', color: '#7a1f2b', meaning: 'Loyalty and lasting friendship. The Victorians loved it.' },
  { m: 'Feb', stone: 'amethyst', name: 'Amethyst', color: '#7b4a9e', meaning: 'Calm and clarity. Ancient Greeks believed it kept you sober.' },
  { m: 'Mar', stone: 'aquamarine', name: 'Aquamarine', color: '#8ccfdd', meaning: 'A sailor\'s stone, said to bring courage and calm seas.' },
  { m: 'Apr', stone: 'diamond', name: 'Diamond', color: '#e9eef3', meaning: 'Strength and forever. Old rose cuts glow softly in candlelight.' },
  { m: 'May', stone: 'emerald', name: 'Emerald', color: '#1d7a4f', meaning: 'Rebirth and love. It was Cleopatra\'s favorite.' },
  { m: 'Jun', stone: 'pearl', name: 'Pearl', color: '#f1e9dc', meaning: 'Purity and wisdom, grown slowly by the sea.' },
  { m: 'Jul', stone: 'ruby', name: 'Ruby', color: '#a3122f', meaning: 'Passion and protection. Called the "king of gems."' },
  { m: 'Aug', stone: 'peridot', name: 'Peridot', color: '#9cc23a', meaning: 'Light and good fortune, sometimes called the "evening emerald."' },
  { m: 'Sep', stone: 'sapphire', name: 'Sapphire', color: '#24479a', meaning: 'Truth and sincerity, the classic heirloom blue.' },
  { m: 'Oct', stone: 'opal', name: 'Opal', color: '#d9d2ec', meaning: 'Hope and imagination, with every color of the rainbow inside.' },
  { m: 'Nov', stone: 'citrine', name: 'Citrine', color: '#e0a02a', meaning: 'Warmth and abundance, known as the "merchant\'s stone."' },
  { m: 'Dec', stone: 'turquoise', name: 'Turquoise', color: '#3fb3a6', meaning: 'Protection on journeys, and a favorite of the mid-century.' },
];

const SERVICES = [
  { name: 'Vintage & Antique Buy and Sell', tone: 'sage', back: 'Curated pieces from 1830–1970, plus fair offers on your own vintage finds. Every piece is inspected and cleaned before it goes in the case.',
    icon: '<circle cx="32" cy="40" r="15"/><circle cx="32" cy="40" r="11"/><path d="M24 22l3-6h10l3 6-8 5z"/><path d="M27 16l5 6 5-6M24 22h16"/>' },
  { name: 'Gold & Silver Chasing', tone: 'rose', back: 'Traditional hand chasing and repoussé by 1974 Studioo. We can restore worn scrollwork or add new engraved designs.',
    icon: '<path d="M44 12l8 8-22 22-10 2 2-10z"/><path d="M40 16l8 8"/><path d="M12 50c4-6 10-2 8 3s4 6 8 1"/><path d="M16 40c-4 1-6 4-5 7"/>' },
  { name: 'Custom Jewelry', tone: 'sage', back: 'Bring us a sketch, a family stone, or just an idea. We will design something new with a vintage soul.',
    icon: '<circle cx="32" cy="42" r="13"/><path d="M24 22h16l4 6-12 9-12-9z"/><path d="M20 28h24M28 22l4 15 4-15"/><path d="M14 14l2 4M50 14l-2 4M32 8v4"/>' },
  { name: 'Jewelry Repair', tone: 'rose', back: 'Ring sizing, re-tipping prongs, restringing pearls, replacing clasps and stones. Heirlooms are handled gently.',
    icon: '<path d="M22 10c-4 8-2 16 6 20l4 4 4-4c8-4 10-12 6-20"/><path d="M28 34l-8 20M36 34l8 20"/><circle cx="32" cy="32" r="2"/>' },
];

const $ = (s, el = document) => el.querySelector(s);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const money = n => '$' + n.toLocaleString();
const eraOf = id => ERAS.find(e => e.id === id);
const etsyUrl = p => p.etsy || SHOP.etsy;
const ebayUrl = p => p.ebay || SHOP.ebay;

const state = { era: 'all', type: 'all', wish: loadWish() };

/* ---------------- SVG jewelry illustrations ---------------- */
const METALS = {
  gold: ['#f8e8b4', '#c9a24e', '#7d5e22'],
  silver: ['#ffffff', '#c7c7cc', '#76767c'],
  rose: ['#fad7c8', '#cf8f78', '#8a5040'],
};

function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16);
  const t = p < 0 ? 0 : 255, a = Math.abs(p);
  const ch = v => Math.round((t - v) * a + v);
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

let uid = 0;
function jewelSVG(p) {
  const id = 'j' + (++uid);
  const [m1, m2, m3] = METALS[p.metal];
  const c = p.color;
  const M = `url(#${id}m)`, G = `url(#${id}g)`;

  const gem = (x, y, r) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${G}" stroke="${M}" stroke-width="${Math.max(1.5, r * .2)}"/>` +
    `<path d="M${x - r * .55} ${y} L${x} ${y - r * .55} L${x + r * .55} ${y} L${x} ${y + r * .55}Z" fill="#fff" opacity=".18"/>` +
    `<circle cx="${x - r * .35}" cy="${y - r * .38}" r="${r * .2}" fill="#fff" opacity=".85"/>`;
  const drop = (x, y, w, h) =>
    `<path d="M${x} ${y} C${x + w} ${y + h * .45} ${x + w * .85} ${y + h} ${x} ${y + h} C${x - w * .85} ${y + h} ${x - w} ${y + h * .45} ${x} ${y}Z" fill="${G}" stroke="${M}" stroke-width="3"/>` +
    `<ellipse cx="${x - w * .3}" cy="${y + h * .55}" rx="${w * .14}" ry="${h * .12}" fill="#fff" opacity=".7"/>`;
  const ring = (cx, cy, rx, ry, n, r) =>
    Array.from({ length: n }, (_, i) => {
      const a = i / n * Math.PI * 2;
      return `<circle cx="${(cx + Math.cos(a) * rx).toFixed(1)}" cy="${(cy + Math.sin(a) * ry).toFixed(1)}" r="${r}" fill="${M}"/>`;
    }).join('');

  let body = '';
  switch (p.type) {
    case 'ring': {
      body = `
        <ellipse cx="100" cy="132" rx="50" ry="44" fill="none" stroke="${M}" stroke-width="11"/>
        <ellipse cx="98" cy="129" rx="50" ry="44" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
        <path d="M74 92 L86 74 H114 L126 92 Z" fill="${M}"/>`;
      if (p.halo) {
        body += Array.from({ length: 12 }, (_, i) => {
          const a = i / 12 * Math.PI * 2;
          return gem(100 + Math.cos(a) * 30, 62 + Math.sin(a) * 30, 6);
        }).join('');
        body += gem(100, 62, 21);
      } else {
        body += `<path d="M70 66 q-10 -12 4 -18 M130 66 q10 -12 -4 -18" fill="none" stroke="${M}" stroke-width="4"/>`;
        body += `<rect x="72" y="36" width="56" height="48" rx="18" fill="${G}" stroke="${M}" stroke-width="5"/>
                 <path d="M80 50 L100 40 L120 50 L120 70 L100 80 L80 70Z" fill="#fff" opacity=".15"/>
                 <circle cx="86" cy="48" r="5" fill="#fff" opacity=".85"/>`;
      }
      break;
    }
    case 'pendant': {
      body = `
        <path d="M24 0 Q55 70 100 80 Q145 70 176 0" fill="none" stroke="${M}" stroke-width="3" stroke-dasharray="5 3"/>
        <rect x="94" y="74" width="12" height="16" rx="4" fill="${M}"/>
        <ellipse cx="100" cy="128" rx="36" ry="44" fill="${G}" stroke="${M}" stroke-width="7"/>
        ${ring(100, 128, 42, 50, 22, 2.6)}`;
      if (p.cameo) {
        body += `<path d="M100 128 m-4 0 a4 4 0 1 1 8 0 a8 8 0 1 1 -16 0 a12 12 0 1 1 24 0 a16 16 0 1 1 -32 0 a19 19 0 1 1 38 0" fill="none" stroke="#fff8f2" stroke-opacity=".9" stroke-width="2.6"/>
                 <path d="M86 150 q-10 10 -4 18 M114 150 q10 10 4 18" fill="none" stroke="#7f8566" stroke-width="3"/>`;
      } else {
        body += `<circle cx="88" cy="112" r="7" fill="#fff" opacity=".7"/>`;
      }
      body += `<line x1="100" y1="172" x2="100" y2="180" stroke="${M}" stroke-width="3"/>`;
      body += p.cameo ? gem(100, 186, 7) : drop(100, 178, 12, 20);
      break;
    }
    case 'brooch': {
      body = `
        <ellipse cx="62" cy="150" rx="26" ry="10" transform="rotate(-35 62 150)" fill="${M}"/>
        <ellipse cx="138" cy="150" rx="26" ry="10" transform="rotate(35 138 150)" fill="${M}"/>
        <circle cx="100" cy="100" r="62" fill="none" stroke="${M}" stroke-width="3" stroke-dasharray="2 5"/>`;
      body += Array.from({ length: 8 }, (_, i) => {
        const a = i / 8 * Math.PI * 2 - Math.PI / 2;
        return gem(100 + Math.cos(a) * 38, 100 + Math.sin(a) * 38, 15);
      }).join('');
      body += gem(100, 100, 22);
      break;
    }
    case 'earrings': {
      body = [62, 138].map(x => `
        <path d="M${x} 52 V36 q0 -18 16 -18 q12 0 12 14" fill="none" stroke="${M}" stroke-width="3"/>
        ${gem(x, 58, 9)}
        <line x1="${x}" y1="67" x2="${x}" y2="88" stroke="${M}" stroke-width="3"/>
        ${drop(x, 86, 24, 76)}`).join('');
      break;
    }
    case 'bracelet': {
      if (p.bangle) {
        body = `
          <ellipse cx="100" cy="104" rx="74" ry="56" fill="none" stroke="${M}" stroke-width="16"/>
          <ellipse cx="100" cy="100" rx="74" ry="56" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3"/>
          <path d="M40 120 q10 10 20 6 q-6 -10 4 -16 M160 120 q-10 10 -20 6 q6 -10 -4 -16" fill="none" stroke="${m3}" stroke-width="2"/>
          ${gem(72, 155, 11)}${gem(128, 155, 11)}${gem(100, 160, 15)}`;
      } else {
        body = Array.from({ length: 26 }, (_, i) => {
          const a = i / 26 * Math.PI * 2;
          const x = 100 + Math.cos(a) * 72, y = 96 + Math.sin(a) * 52;
          return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="7" ry="5" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="none" stroke="${M}" stroke-width="3"/>`;
        }).join('');
        body += [0.18, 0.32, 0.5, 0.68, 0.82].map(t => {
          const a = t * Math.PI;
          const x = 100 + Math.cos(a) * 72 * -1, y = 96 + Math.sin(a) * 52;
          return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + 12).toFixed(1)}" stroke="${M}" stroke-width="2"/>` + drop(x, y + 10, 9, 22);
        }).join('');
      }
      break;
    }
  }

  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${p.name}">
    <defs>
      <linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${m1}"/><stop offset=".5" stop-color="${m2}"/><stop offset="1" stop-color="${m3}"/>
      </linearGradient>
      <radialGradient id="${id}g" cx=".35" cy=".3" r=".85">
        <stop offset="0" stop-color="#fff" stop-opacity=".95"/>
        <stop offset=".2" stop-color="${shade(c, .45)}"/>
        <stop offset=".62" stop-color="${c}"/>
        <stop offset="1" stop-color="${shade(c, -.5)}"/>
      </radialGradient>
      <filter id="${id}s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#5a3a30" flood-opacity=".28"/>
      </filter>
    </defs>
    <ellipse cx="100" cy="186" rx="60" ry="6" fill="#5a3a30" opacity=".08"/>
    <g filter="url(#${id}s)">${body}</g>
  </svg>`;
}

/* ---------------- Collection ---------------- */
function renderTimeline() {
  $('#timeline').innerHTML = ERAS.map(e => `
    <button class="era-btn" role="tab" data-era="${e.id}" aria-selected="${e.id === state.era}">
      <span class="era-dot"></span>
      <span class="era-label">${e.name}</span>
      <span class="era-years">${e.years}</span>
    </button>`).join('');
  $('#eraNote').textContent = eraOf(state.era).note;
}

function renderChips() {
  $('#chips').innerHTML = TYPES.map(t =>
    `<button class="chip" data-type="${t.id}" aria-pressed="${t.id === state.type}">${t.name}</button>`).join('');
}

function heartIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.3-9-8.6C1.6 8.3 3.5 5 6.8 5c2 0 3.4 1.1 4.1 2.3h2.2C13.8 6.1 15.2 5 17.2 5c3.3 0 5.2 3.3 3.8 6.4C19 15.7 12 20 12 20z"/></svg>';
}

function renderGrid() {
  const list = PRODUCTS.filter(p =>
    (state.era === 'all' || p.era === state.era) && (state.type === 'all' || p.type === state.type));

  $('#resultCount').textContent = list.length
    ? `Showing ${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`
    : '';

  $('#grid').innerHTML = list.length ? list.map((p, i) => `
    <article class="card" data-id="${p.id}" tabindex="0" style="animation-delay:${i * 60}ms" aria-label="${p.name}, ${money(p.price)}">
      <button class="heart ${state.wish.has(p.id) ? 'on' : ''}" data-heart="${p.id}" aria-label="Add to wishlist" aria-pressed="${state.wish.has(p.id)}">${heartIcon()}</button>
      <div class="card-media">
        ${jewelSVG(p)}
        <span class="card-era">${eraOf(p.era).name}</span>
        ${p.sold ? '<span class="card-sold">Sold</span>' : ''}
      </div>
      <h3>${p.name}</h3>
      <div class="card-meta">${p.metalName} · ${p.stoneName}</div>
      <div class="card-foot">
        <span class="price">${p.sold ? 'Sold' : money(p.price)}</span>
        <span class="peek">Take a closer look &rarr;</span>
      </div>
    </article>`).join('')
    : `<p class="empty">Nothing from this era in the case right now. <a href="#visit">Ask us</a> and we'll go hunting for one.</p>`;
}

function bindCollection() {
  $('#timeline').addEventListener('click', e => {
    const b = e.target.closest('[data-era]');
    if (!b) return;
    state.era = b.dataset.era;
    renderTimeline();
    renderGrid();
  });
  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    state.type = b.dataset.type;
    renderChips();
    renderGrid();
  });

  const grid = $('#grid');
  grid.addEventListener('click', e => {
    const h = e.target.closest('[data-heart]');
    if (h) { e.stopPropagation(); toggleWish(+h.dataset.heart, h); return; }
    const card = e.target.closest('.card');
    if (card) openModal(+card.dataset.id);
  });
  grid.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList.contains('card')) openModal(+e.target.dataset.id);
  });

  // 3D tilt + light glint following the pointer
  if (!reduceMotion) {
    grid.addEventListener('pointermove', e => {
      const card = e.target.closest('.card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', `${(x - .5) * 10}deg`);
      card.style.setProperty('--rx', `${(.5 - y) * 10}deg`);
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    });
    grid.addEventListener('pointerout', e => {
      const card = e.target.closest('.card');
      if (card && !card.contains(e.relatedTarget)) {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      }
    });
  }
}

/* ---------------- Quick-view modal with loupe ---------------- */
let lastFocus = null;
function openModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  lastFocus = document.activeElement;
  const media = $('#modalMedia');
  media.querySelectorAll(':scope > svg').forEach(s => s.remove());
  media.insertAdjacentHTML('afterbegin', jewelSVG(p));
  $('#loupe').innerHTML = jewelSVG(p);

  const era = eraOf(p.era);
  $('#modalInfo').innerHTML = `
    <p class="eyebrow">${era.name} · ${era.years}</p>
    <h2 id="modalTitle">${p.name}</h2>
    <span class="price">${p.sold ? 'Sold' : money(p.price)}</span>
    <p>${p.desc}</p>
    <dl class="specs">
      <dt>Metal</dt><dd>${p.metalName}</dd>
      <dt>Stone</dt><dd>${p.stoneName}</dd>
      <dt>Size</dt><dd>${p.size}</dd>
      <dt>Condition</dt><dd>Excellent vintage, professionally cleaned</dd>
    </dl>
    <div class="modal-ctas">
      ${p.sold
        ? `<a class="btn btn-primary" href="mailto:rosecatvintage@gmail.com?subject=${encodeURIComponent('Looking for something like: ' + p.name)}">Find me one like it</a>`
        : `<a class="btn btn-primary" href="${etsyUrl(p)}" target="_blank" rel="noopener">Buy on Etsy</a>
           <a class="btn btn-ebay" href="${ebayUrl(p)}" target="_blank" rel="noopener">Buy on eBay</a>`}
      <button class="btn btn-ghost" data-heart-modal="${p.id}">${state.wish.has(p.id) ? '♥ In wishlist' : '♡ Add to wishlist'}</button>
    </div>
    <p class="modal-note">Checkout is through Etsy or eBay. We don't take payments on this site.</p>`;

  const modal = $('#modal');
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  $('.modal-close', modal).focus();
}

function closeModal() {
  $('#modal').hidden = true;
  document.body.style.overflow = '';
  lastFocus?.focus();
}

function bindModal() {
  const modal = $('#modal');
  modal.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeModal();
    const h = e.target.closest('[data-heart-modal]');
    if (h) {
      const id = +h.dataset.heartModal;
      toggleWish(id);
      h.textContent = state.wish.has(id) ? '♥ In wishlist' : '♡ Add to wishlist';
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!modal.hidden) closeModal();
    closeDrawer();
  });

  // Jeweler's loupe: a magnified copy of the SVG follows the cursor
  const media = $('#modalMedia'), loupe = $('#loupe'), ZOOM = 2.6, SIZE = 170;
  media.addEventListener('pointermove', e => {
    const r = media.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const big = $('svg', loupe);
    big.style.width = r.width * ZOOM + 'px';
    big.style.height = r.height * ZOOM + 'px';
    big.style.transform = `translate(${SIZE / 2 - x * ZOOM}px, ${SIZE / 2 - y * ZOOM}px)`;
    loupe.style.left = x - SIZE / 2 + 'px';
    loupe.style.top = y - SIZE / 2 + 'px';
    loupe.classList.add('on');
  });
  media.addEventListener('pointerleave', () => loupe.classList.remove('on'));
}

/* ---------------- Wishlist ---------------- */
function loadWish() {
  try { return new Set(JSON.parse(localStorage.getItem('rosecat-wish') || '[]')); }
  catch { return new Set(); }
}
function saveWish() {
  try { localStorage.setItem('rosecat-wish', JSON.stringify([...state.wish])); } catch { /* storage unavailable */ }
}

function toggleWish(id, btn) {
  const p = PRODUCTS.find(x => x.id === id);
  if (state.wish.has(id)) {
    state.wish.delete(id);
    toast(`Removed ${p.name}`);
  } else {
    state.wish.add(id);
    toast(`♥ ${p.name} added to your wishlist`);
    if (btn) burst(btn);
  }
  saveWish();
  updateWishUI();
  const t = $('#wishToggle');
  t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump');
}

function updateWishUI() {
  $('#wishCount').textContent = state.wish.size;
  document.querySelectorAll('[data-heart]').forEach(h => {
    const on = state.wish.has(+h.dataset.heart);
    h.classList.toggle('on', on);
    h.setAttribute('aria-pressed', on);
  });
  const items = PRODUCTS.filter(p => state.wish.has(p.id));
  $('#drawerBody').innerHTML = items.length ? items.map(p => `
    <div class="wish-item">
      <div class="thumb">${jewelSVG(p)}</div>
      <div>
        <h4>${p.name}</h4>
        <div class="price">${p.sold ? 'Sold' : money(p.price)}</div>
        ${p.sold ? '' : `<a href="${etsyUrl(p)}" target="_blank" rel="noopener">Etsy</a><a href="${ebayUrl(p)}" target="_blank" rel="noopener">eBay</a>`}
      </div>
      <button class="remove" data-remove="${p.id}" aria-label="Remove ${p.name}">&times;</button>
    </div>`).join('')
    : '<p class="wish-empty">Your wishlist is empty.<br>Tap a ♡ on any piece to save it here.</p>';
}

function openDrawer() {
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#drawerScrim').classList.add('open');
}
function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  $('#drawerScrim').classList.remove('open');
}

function bindWishlist() {
  $('#wishToggle').addEventListener('click', openDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#drawerScrim').addEventListener('click', closeDrawer);
  $('#drawerBody').addEventListener('click', e => {
    const r = e.target.closest('[data-remove]');
    if (r) toggleWish(+r.dataset.remove);
  });
}

/* ---------------- Birthstone finder ---------------- */
function renderMonths(active) {
  $('#months').innerHTML = BIRTHSTONES.map((b, i) => `
    <button class="month" role="tab" data-month="${i}" aria-selected="${i === active}" style="--c:${b.color}">
      <i></i><span>${b.m}</span>
    </button>`).join('');

  const b = BIRTHSTONES[active];
  const matches = PRODUCTS.filter(p => p.stone === b.stone);
  const gem = jewelSVG({ name: b.name, type: 'brooch', metal: 'gold', color: b.color })
    .replace('<svg ', '<svg class="stone-gem" ');
  $('#stoneCard').innerHTML = `
    ${gem}
    <div>
      <p class="eyebrow">${monthName(active)} birthstone</p>
      <h3>${b.name}</h3>
      <p>${b.meaning}</p>
      ${matches.length
        ? `<div class="stone-matches">${matches.map(p => `<button data-open="${p.id}">See the ${p.name} &rarr;</button>`).join('')}</div>`
        : `<p class="stone-none">There's no ${b.name.toLowerCase()} in the case right now. <a href="mailto:rosecatvintage@gmail.com?subject=${encodeURIComponent(b.name + ' request')}">Ask us to find one</a>.</p>`}
    </div>`;
}
const monthName = i => new Date(2000, i, 1).toLocaleString('en', { month: 'long' });

function bindBirthstones() {
  $('#months').addEventListener('click', e => {
    const b = e.target.closest('[data-month]');
    if (b) renderMonths(+b.dataset.month);
  });
  $('#stoneCard').addEventListener('click', e => {
    const b = e.target.closest('[data-open]');
    if (b) openModal(+b.dataset.open);
  });
}

/* ---------------- Services ---------------- */
function renderServices() {
  $('#services-grid').innerHTML = SERVICES.map(s => `
    <button class="flip reveal" aria-label="${s.name}: ${s.back}">
      <div class="flip-inner">
        <div class="flip-face">
          <div class="svc-icon ${s.tone === 'rose' ? 'rose' : ''}"><svg viewBox="0 0 64 64" aria-hidden="true">${s.icon}</svg></div>
          <h3>${s.name}</h3>
          <small>hover or tap</small>
        </div>
        <div class="flip-face flip-back"><h3>${s.name}</h3><p>${s.back}</p></div>
      </div>
    </button>`).join('');
  $('#services-grid').addEventListener('click', e => {
    e.target.closest('.flip')?.classList.toggle('flipped');
  });
}

/* ---------------- Hero: tilt + cat easter egg ---------------- */
const MEOWS = ['Mrrrow. That cameo is mine.', 'Purrr… try the garnet ring.', 'The cat approves of your taste.', 'Mew! Older than your ex, remember.', '*slow blink* ✨'];
function bindHero() {
  const frame = $('#heroTilt');
  if (!reduceMotion) {
    frame.addEventListener('pointermove', e => {
      const r = frame.getBoundingClientRect();
      frame.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 14}deg`);
      frame.style.setProperty('--rx', `${(.5 - (e.clientY - r.top) / r.height) * 14}deg`);
    });
    frame.addEventListener('pointerleave', () => {
      frame.style.setProperty('--rx', '0deg');
      frame.style.setProperty('--ry', '0deg');
    });
  }
  let n = 0;
  frame.addEventListener('click', e => {
    toast(MEOWS[n++ % MEOWS.length]);
    frame.classList.remove('purr'); void frame.offsetWidth; frame.classList.add('purr');
    burst(e, 18);
  });
}

/* ---------------- Sparkles ---------------- */
const SPARK_COLORS = ['#d9c294', '#ecc9bd', '#c98577', '#ffffff'];
function spark(x, y, spread = 30) {
  const s = document.createElement('span');
  s.className = 'spark';
  s.style.left = x - 6 + 'px';
  s.style.top = y - 6 + 'px';
  s.style.setProperty('--c', SPARK_COLORS[Math.random() * SPARK_COLORS.length | 0]);
  s.style.setProperty('--dx', (Math.random() - .5) * spread * 2 + 'px');
  s.style.setProperty('--dy', (Math.random() - .3) * spread * 2 + 'px');
  document.body.appendChild(s);
  s.addEventListener('animationend', () => s.remove());
}
function burst(src, count = 12) {
  if (reduceMotion) return;
  let x, y;
  if (src instanceof Event) { x = src.clientX; y = src.clientY; }
  else { const r = src.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
  for (let i = 0; i < count; i++) spark(x, y, 60);
}
function bindSparkleTrail() {
  if (reduceMotion || matchMedia('(pointer: coarse)').matches) return;
  let last = 0;
  document.addEventListener('pointermove', e => {
    const now = performance.now();
    if (now - last < 45) return;
    last = now;
    spark(e.clientX, e.clientY, 14);
  });
}

/* ---------------- Misc ---------------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

function bindReveal() {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

function init() {
  renderTimeline();
  renderChips();
  renderGrid();
  renderMonths(new Date().getMonth());
  renderServices();
  updateWishUI();

  document.querySelectorAll('.shop-etsy').forEach(a => a.href = SHOP.etsy);
  document.querySelectorAll('.shop-ebay').forEach(a => a.href = SHOP.ebay);
  $('#year').textContent = new Date().getFullYear();

  bindCollection();
  bindModal();
  bindWishlist();
  bindBirthstones();
  bindHero();
  bindSparkleTrail();
  bindReveal();
}

init();
