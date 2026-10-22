// ===== ข้อมูลเมนู (แก้ชื่อ ราคา อีโมจิ ได้ที่นี่) =====
const MENU = [
  {
    id: 'promo', title: 'โปรโมชัน',
    items: [
      { name: 'พิซซ่าชีสเยิ้ม เดอะบอกซ์ ซิกเนเจอร์', price: 159, emoji: '🍕🥤' },
      { name: 'พิซซ่าถาดเล็ก + น้ำ', price: 89, emoji: '🍕', badge: 'คุ้ม!' },
      { name: 'พิซซ่าไซส์ S ราคาพิเศษ', price: 59, emoji: '🍕' },
      { name: 'ซีฟู้ดแชร์ ทีมชีส', price: 99, emoji: '🦐' },
      { name: 'ไก่ป๊อปแชร์ ทีมกรอบ', price: 99, emoji: '🍗' },
      { name: 'ทาร์ตไข่ 6 ชิ้น ฟรี 2 ชิ้น', price: 175, emoji: '🥧', badge: '6 ฟรี 2' },
      { name: 'ทาร์ตไข่ 3 ชิ้น ฟรี 1 ชิ้น', price: 94, emoji: '🥧', badge: '3 ฟรี 1' },
      { name: 'ซอสพิเศษสูตรเชฟ', price: 15, emoji: '🍅' }
    ]
  },
  {
    id: 'best', title: 'สินค้าขายดี',
    items: [
      { name: 'ปาร์ตี้ บ็อกซ์ 4 คน', price: 449, emoji: '🍕🍗🥤' },
      { name: 'จุใจ บ็อกซ์', price: 349, emoji: '🍕🍟' },
      { name: 'ออลอินวัน บ็อกซ์', price: 299, emoji: '🍕🍗', badge: 'ใหม่!' },
      { name: 'คริสปี้ บ็อกซ์', price: 199, emoji: '🍗' },
      { name: 'ชุดอิ่มคุ้ม 2', price: 159, emoji: '🍕🥤' }
    ]
  },
  {
    id: 'pizza', title: 'พิซซ่า',
    items: [
      { name: 'มาร์การิตา', price: 189, emoji: '🍕' },
      { name: 'เปปเปอโรนี ชีสเยิ้ม', price: 229, emoji: '🍕🌶️' },
      { name: 'ฮาวายเอี้ยน', price: 219, emoji: '🍍' },
      { name: 'ซีฟู้ดซุปเปอร์', price: 259, emoji: '🦐' },
      { name: 'เห็ดทรัฟเฟิล', price: 279, emoji: '🍄', badge: 'ใหม่!' },
      { name: 'ดับเบิลชีส 4 อย่าง', price: 249, emoji: '🧀' }
    ]
  },
  {
    id: 'group', title: 'ชุดอิ่มกลุ่ม',
    items: [
      { name: 'ชุดแชร์ 2 คน', price: 349, emoji: '🍕🥤' },
      { name: 'ชุดครอบครัว 4 คน', price: 599, emoji: '🍕🍗' },
      { name: 'ชุดปาร์ตี้ 6 คน', price: 899, emoji: '🍕🍕🍗' }
    ]
  },
  {
    id: 'side', title: 'ของทานเล่น',
    items: [
      { name: 'ปีกไก่ทอด 6 ชิ้น', price: 119, emoji: '🍗' },
      { name: 'เฟรนช์ฟรายส์', price: 49, emoji: '🍟' },
      { name: 'สลัดผักสด', price: 69, emoji: '🥗' },
      { name: 'ขนมปังกระเทียม', price: 59, emoji: '🥖' }
    ]
  },
  {
    id: 'drink', title: 'เครื่องดื่ม',
    items: [
      { name: 'น้ำอัดลม', price: 25, emoji: '🥤' },
      { name: 'ชาเย็น', price: 35, emoji: '🧋' },
      { name: 'น้ำเปล่า', price: 15, emoji: '💧' }
    ]
  },
  {
    id: 'dessert', title: 'ของหวาน',
    items: [
      { name: 'ทาร์ตไข่', price: 35, emoji: '🥧' },
      { name: 'ไอศกรีมวานิลลา', price: 45, emoji: '🍨' },
      { name: 'เค้กช็อกโกแลต', price: 79, emoji: '🍰' }
    ]
  }
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => '฿' + n.toFixed(2);

// ===== สร้างหมวดและการ์ดเมนู =====
const root = $('#menuRoot');
const tabs = $('#catTabs');

MENU.forEach((cat, i) => {
  const sec = document.createElement('section');
  sec.className = 'menu-section';
  sec.id = 'cat-' + cat.id;
  sec.innerHTML = `<h2>${cat.title}</h2>`;

  cat.items.forEach(it => {
    const card = document.createElement('article');
    card.className = 'menu-card';
    card.dataset.name = it.name.toLowerCase();
    card.innerHTML = `
      <div class="menu-info">
        <div class="menu-name">${it.name}</div>
        <div class="menu-price">${fmt(it.price)}</div>
      </div>
      <div class="menu-img">
        <span>${it.emoji}</span>
        ${it.badge ? `<span class="menu-badge">${it.badge}</span>` : ''}
        <span class="add-hint">+</span>
      </div>`;
    card.addEventListener('click', () => addToCart(it));
    sec.appendChild(card);
  });
  root.appendChild(sec);

  const tab = document.createElement('button');
  tab.className = 'cat-tab' + (i === 0 ? ' active' : '');
  tab.textContent = cat.title;
  tab.dataset.target = sec.id;
  tab.addEventListener('click', () => {
    clearSearch();
    document.getElementById(sec.id).scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  tabs.appendChild(tab);
});

// ===== วัดความสูงแถบร้าน เพื่อให้แถบหมวดติดใต้แถบร้านพอดี =====
function setOffsets() {
  const h = $('#storeBar').offsetHeight;
  document.documentElement.style.setProperty('--store-h', h + 'px');
  const total = h + $('#catBar').offsetHeight + 8;
  $$('.menu-section').forEach(s => (s.style.scrollMarginTop = total + 'px'));
}
window.addEventListener('resize', setOffsets);
window.addEventListener('load', setOffsets);
setOffsets();

// ===== เลื่อนหน้าจอ: เปลี่ยนแท็บตามหมวดที่เห็น + ปุ่มกลับขึ้นบน =====
const sections = $$('.menu-section');
const tabEls = $$('.cat-tab');
const toTop = $('#toTop');
let ticking = false;

function updateActiveTab() {
  const line = $('#storeBar').offsetHeight + $('#catBar').offsetHeight + 20;
  let activeId = sections[0].id;
  for (const s of sections) {
    if (s.classList.contains('hidden')) continue;
    if (s.getBoundingClientRect().top <= line) activeId = s.id;
  }
  tabEls.forEach(t => {
    const on = t.dataset.target === activeId;
    if (on && !t.classList.contains('active')) {
      t.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
    t.classList.toggle('active', on);
  });
  toTop.classList.toggle('show', window.scrollY > 500);
}
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => { updateActiveTab(); ticking = false; });
    ticking = true;
  }
}, { passive: true });
updateActiveTab();

toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ===== ค้นหาเมนู =====
const searchBtn = $('#searchBtn');
const searchRow = $('#searchRow');
const searchInput = $('#searchInput');
const noResult = $('#noResult');

searchBtn.addEventListener('click', () => {
  const open = searchRow.classList.toggle('open');
  searchBtn.classList.toggle('open', open);
  if (open) searchInput.focus(); else clearSearch();
  setOffsets();
});

function runSearch() {
  const q = searchInput.value.trim().toLowerCase();
  let total = 0;
  sections.forEach(sec => {
    let shown = 0;
    $$('.menu-card', sec).forEach(c => {
      const hit = !q || c.dataset.name.includes(q);
      c.classList.toggle('hidden', !hit);
      if (hit) shown++;
    });
    sec.classList.toggle('hidden', shown === 0);
    total += shown;
  });
  noResult.hidden = total > 0;
  updateActiveTab();
}
function clearSearch() {
  searchInput.value = '';
  runSearch();
}
searchInput.addEventListener('input', runSearch);
$('#clearBtn').addEventListener('click', () => { clearSearch(); searchInput.focus(); });

// ===== ตะกร้า (ใช้ข้อมูลเดียวกับหน้าแรก) =====
let cart = [];
try { cart = JSON.parse(localStorage.getItem('pizzaCart')) || []; } catch (e) { cart = []; }

function updateCart() {
  const b = $('#cartCount');
  const n = cart.reduce((t, i) => t + (i.qty || 1), 0);
  b.textContent = n;
  b.classList.toggle('show', n > 0);
  try { localStorage.setItem('pizzaCart', JSON.stringify(cart)); } catch (e) {}
}
function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast.id);
  showToast.id = setTimeout(() => t.classList.remove('show'), 2000);
}
function addToCart(it) {
  const productId = productIdForName(it.name);
  const found = cart.find(c => c.product_id === productId || c.name === it.name);
  if (found) found.qty = (found.qty || 1) + 1;
  else cart.push({ product_id: productId, name: it.name, price: it.price, emoji: it.emoji, qty: 1 });
  updateCart();
  showToast('เพิ่ม "' + it.name + '" ลงตะกร้าแล้ว 🍕');
}
updateCart();

// ===== เลือกร้าน / วิธีรับสินค้า (จำค่าไว้ใช้ทุกหน้า) =====
const modal = $('#modal');
let mode = 'รับที่ร้าน';

try {
  const s = JSON.parse(localStorage.getItem('pizzaStore'));
  if (s) {
    mode = s.mode;
    $('#modeText').textContent = s.mode;
    $('#storeText').textContent = s.store;
    $('#timeText').textContent = s.time;
    $('#storeSelect').value = s.store;
    $('#timeSelect').value = s.time;
    $$('.seg-btn').forEach(x => x.classList.toggle('active', x.dataset.mode === mode));
  }
} catch (e) {}

$('#changeBtn').addEventListener('click', () => modal.classList.add('open'));
$('#cancelBtn').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

$$('.seg-btn').forEach(b => b.addEventListener('click', () => {
  $$('.seg-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  mode = b.dataset.mode;
}));

$('#saveBtn').addEventListener('click', () => {
  const data = { mode, store: $('#storeSelect').value, time: $('#timeSelect').value };
  $('#modeText').textContent = data.mode;
  $('#storeText').textContent = data.store;
  $('#timeText').textContent = data.time;
  try { localStorage.setItem('pizzaStore', JSON.stringify(data)); } catch (e) {}
  modal.classList.remove('open');
  showToast('อัปเดตข้อมูลการรับสินค้าแล้ว');
  setOffsets();
});
