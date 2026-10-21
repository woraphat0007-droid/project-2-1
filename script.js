// ===== ตัวช่วยเลือก element =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ===== สไลด์แบนเนอร์ =====
const slidesEl = $('#slides');
const slideCount = $$('.slide').length;
const dotsEl = $('#dots');
let current = 0;
let timer;

for (let i = 0; i < slideCount; i++) {
  const d = document.createElement('button');
  d.className = 'dot' + (i === 0 ? ' active' : '');
  d.setAttribute('aria-label', 'สไลด์ที่ ' + (i + 1));
  d.addEventListener('click', () => { goTo(i); restart(); });
  dotsEl.appendChild(d);
}

function goTo(i) {
  current = (i + slideCount) % slideCount;
  slidesEl.style.transform = `translateX(-${current * 100}%)`;
  $$('.dot').forEach((d, idx) => d.classList.toggle('active', idx === current));
}
function restart() {
  clearInterval(timer);
  timer = setInterval(() => goTo(current + 1), 4500);
}
restart();

// ปัดซ้าย-ขวาบนมือถือ
let startX = 0;
const hero = $('#hero');
hero.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
hero.addEventListener('touchend', e => {
  const diff = e.changedTouches[0].clientX - startX;
  if (Math.abs(diff) > 50) { goTo(current + (diff < 0 ? 1 : -1)); restart(); }
});

// ===== ตะกร้า =====
let cart = [];
try { cart = JSON.parse(localStorage.getItem('pizzaCart')) || []; } catch (e) { cart = []; }

function updateCart() {
  const badge = $('#cartCount');
  const n = cart.reduce((t, i) => t + (i.qty || 1), 0);
  badge.textContent = n;
  badge.classList.toggle('show', n > 0);
  try { localStorage.setItem('pizzaCart', JSON.stringify(cart)); } catch (e) {}
}

function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast.id);
  showToast.id = setTimeout(() => t.classList.remove('show'), 2200);
}

$$('[data-item]').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.item;
    const found = cart.find(c => c.name === name);
    if (found) found.qty = (found.qty || 1) + 1;
    else cart.push({ name, price: Number(btn.dataset.price) || 0, emoji: btn.dataset.emoji || '🍕', qty: 1 });
    updateCart();
    showToast('เพิ่ม "' + btn.dataset.item + '" ลงตะกร้าแล้ว 🍕');
  });
});


// ===== Modal เปลี่ยนร้าน / วิธีรับสินค้า =====
const modal = $('#modal');
let mode = 'รับที่ร้าน';

const openModal = () => modal.classList.add('open');
const closeModal = () => modal.classList.remove('open');

$('#changeBtn').addEventListener('click', openModal);
$('#cancelBtn').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

$$('.seg-btn').forEach(b => {
  b.addEventListener('click', () => {
    $$('.seg-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    mode = b.dataset.mode;
  });
});

$('#saveBtn').addEventListener('click', () => {
  $('#modeText').textContent = mode;
  $('#storeText').textContent = $('#storeSelect').value;
  $('#timeText').textContent = $('#timeSelect').value;
  closeModal();
  showToast('อัปเดตข้อมูลการรับสินค้าแล้ว');
});

$('#goDelivery').addEventListener('click', () => {
  mode = 'เดลิเวอรี';
  $$('.seg-btn').forEach(x => x.classList.toggle('active', x.dataset.mode === mode));
  openModal();
});

updateCart();

// ===== จำสาขา/วิธีรับสินค้าที่เลือก (ใช้ร่วมกับหน้าเมนูและตะกร้า) =====
try {
  const st = JSON.parse(localStorage.getItem('pizzaStore'));
  if (st) {
    mode = st.mode;
    $('#modeText').textContent = st.mode;
    $('#storeText').textContent = st.store;
    $('#timeText').textContent = st.time;
    $('#storeSelect').value = st.store;
    $('#timeSelect').value = st.time;
    $$('.seg-btn').forEach(x => x.classList.toggle('active', x.dataset.mode === mode));
  }
} catch (e) {}
$('#saveBtn').addEventListener('click', () => {
  try {
    localStorage.setItem('pizzaStore', JSON.stringify({
      mode, store: $('#storeSelect').value, time: $('#timeSelect').value
    }));
  } catch (e) {}
});
