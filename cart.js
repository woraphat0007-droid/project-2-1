// ===== ตั้งค่า =====
const DELIVERY_FEE = 40;        // ค่าจัดส่ง (บาท) เฉพาะเดลิเวอรี
const FREE_DELIVERY_MIN = 350;  // ส่งฟรีเมื่อยอดครบเท่านี้ (ตรงกับโปรบนหน้าแรก) ตั้งเป็น 0 เพื่อปิด

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = n => '฿' + n.toFixed(2);

// ===== โหลดตะกร้า (รวมรายการซ้ำและรองรับข้อมูลรุ่นเก่า) =====
let cart = [];
try {
  const raw = JSON.parse(localStorage.getItem('pizzaCart')) || [];
  raw.forEach(it => {
    const found = cart.find(c => c.name === it.name);
    if (found) found.qty += it.qty || 1;
    else cart.push({ name: it.name, price: Number(it.price) || 0, emoji: it.emoji || '🍕', qty: it.qty || 1 });
  });
} catch (e) { cart = []; }

function save() {
  try { localStorage.setItem('pizzaCart', JSON.stringify(cart)); } catch (e) {}
}

// ===== สถานะร้าน / วิธีรับสินค้า =====
let mode = 'รับที่ร้าน';
try {
  const s = JSON.parse(localStorage.getItem('pizzaStore'));
  if (s) {
    mode = s.mode;
    $('#storeSelect').value = s.store;
    $('#timeSelect').value = s.time;
    $('#storeText').textContent = s.store;
    $('#timeText').textContent = s.time;
  }
} catch (e) {}
const isDelivery = () => mode === 'เดลิเวอรี';

function syncStoreBar() {
  $('#modeText').textContent = mode;
  $$('.seg-btn').forEach(x => x.classList.toggle('active', x.dataset.mode === mode));
}

// ===== แสดงผลตะกร้า =====
function render() {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);

  // ตัวเลขบนไอคอนตะกร้า
  const badge = $('#cartCount');
  badge.textContent = totalQty;
  badge.classList.toggle('show', totalQty > 0);

  const empty = cart.length === 0;
  $('#emptyView').hidden = !empty;
  $('#filledView').hidden = empty;
  if (empty) return;

  // รายการสินค้า
  const list = $('#cartList');
  list.innerHTML = '';
  cart.forEach((it, idx) => {
    const el = document.createElement('div');
    el.className = 'cart-item';

    const top = document.createElement('div');
    top.className = 'ci-top';
    const img = document.createElement('div');
    img.className = 'ci-img';
    img.textContent = it.emoji;
    const info = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'ci-name';
    name.textContent = it.name;
    const rm = document.createElement('button');
    rm.className = 'ci-remove';
    rm.textContent = 'ลบออก';
    rm.addEventListener('click', () => {
      const removed = cart.splice(idx, 1)[0];
      save(); render();
      toast('ลบ "' + removed.name + '" แล้ว');
    });
    info.append(name, rm);
    top.append(img, info);

    const bottom = document.createElement('div');
    bottom.className = 'ci-bottom';
    const qty = document.createElement('div');
    qty.className = 'qty';
    const minus = document.createElement('button');
    minus.textContent = '−';
    minus.disabled = it.qty <= 1;
    minus.setAttribute('aria-label', 'ลดจำนวน');
    minus.addEventListener('click', () => { if (it.qty > 1) { it.qty--; save(); render(); } });
    const num = document.createElement('span');
    num.textContent = it.qty;
    const plus = document.createElement('button');
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'เพิ่มจำนวน');
    plus.addEventListener('click', () => { it.qty++; save(); render(); });
    qty.append(minus, num, plus);
    const price = document.createElement('div');
    price.className = 'ci-price';
    price.textContent = money(it.price * it.qty);
    bottom.append(qty, price);

    el.append(top, bottom);
    list.appendChild(el);
  });

  // คำนวณยอด
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = isDelivery();
  const freeShip = delivery && FREE_DELIVERY_MIN > 0 && subtotal >= FREE_DELIVERY_MIN;
  const fee = delivery && !freeShip ? DELIVERY_FEE : 0;
  const grand = subtotal + fee;

  $('#itemCount').textContent = totalQty + ' รายการ';
  $('#subtotal').textContent = money(subtotal);

  // แถวค่าจัดส่ง: แสดงเฉพาะเดลิเวอรี
  $('#feeRow').hidden = !delivery;
  $('#fee').innerHTML = freeShip ? `<s>${money(DELIVERY_FEE)}</s>ฟรี` : money(fee);

  $('#grand').textContent = money(grand);
  $('#deliveryNote').hidden = !delivery;
  $('#pickupNote').hidden = delivery;
}

// ===== ข้อความแจ้งเตือน =====
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.id);
  toast.id = setTimeout(() => t.classList.remove('show'), 2000);
}

$('#addReward').addEventListener('click', e => { e.preventDefault(); toast('ฟีเจอร์รีวอร์ดสเร็วๆ นี้'); });
$('#rewardsLink').addEventListener('click', e => { e.preventDefault(); toast('ฟีเจอร์รีวอร์ดสเร็วๆ นี้'); });

$('#payBtn').addEventListener('click', () => {
  if (!cart.length) return;
  const ok = confirm('ยืนยันการสั่งซื้อ ' + $('#grand').textContent + ' ?');
  if (!ok) return;
  cart = [];
  save();
  render();
  toast('สั่งซื้อสำเร็จ ขอบคุณที่ใช้บริการ 🍕');
});

// ===== หน้าต่างเปลี่ยนร้าน =====
const modal = $('#modal');
$('#changeBtn').addEventListener('click', () => modal.classList.add('open'));
$('#cancelBtn').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

$$('.seg-btn').forEach(b => b.addEventListener('click', () => {
  mode = b.dataset.mode;
  $$('.seg-btn').forEach(x => x.classList.toggle('active', x === b));
}));

$('#saveBtn').addEventListener('click', () => {
  const data = { mode, store: $('#storeSelect').value, time: $('#timeSelect').value };
  $('#storeText').textContent = data.store;
  $('#timeText').textContent = data.time;
  try { localStorage.setItem('pizzaStore', JSON.stringify(data)); } catch (e) {}
  syncStoreBar();
  modal.classList.remove('open');
  render();   // คำนวณค่าจัดส่งใหม่ทันที
  toast(isDelivery() ? 'เปลี่ยนเป็นเดลิเวอรี' : 'เปลี่ยนเป็นรับที่ร้าน');
});

syncStoreBar();
save();
render();
