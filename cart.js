const DELIVERY_FEE = 40;
const FREE_DELIVERY_MIN = 350;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = amount => '฿' + amount.toFixed(2);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NEW_ADDRESS = '__new_address__';

let cart = [];
let mode = 'รับที่ร้าน';
let session = null;
let addresses = [];
let checkoutBusy = false;

try {
  const storedCart = JSON.parse(localStorage.getItem('pizzaCart') || '[]');
  if (Array.isArray(storedCart)) {
    cart = storedCart.map(item => ({
      ...item,
      product_id: item.product_id || productIdForName(item.name),
      qty: Number(item.qty) || 1,
    }));
  }
} catch (error) {
  showCheckoutMessage('อ่านตะกร้าไม่สำเร็จ กรุณาโหลดหน้าใหม่');
}

try {
  const store = JSON.parse(localStorage.getItem('pizzaStore') || 'null');
  if (store) {
    mode = store.mode || mode;
    $('#storeSelect').value = store.store || $('#storeSelect').value;
    $('#timeSelect').value = store.time || $('#timeSelect').value;
    $('#storeText').textContent = store.store || $('#storeText').textContent;
    $('#timeText').textContent = store.time || $('#timeText').textContent;
  }
} catch (error) {
  showCheckoutMessage('อ่านข้อมูลร้านที่เลือกไม่สำเร็จ');
}

function saveCart() {
  try {
    localStorage.setItem('pizzaCart', JSON.stringify(cart));
    return true;
  } catch (error) {
    showCheckoutMessage('บันทึกตะกร้าไม่ได้ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์');
    return false;
  }
}

function showCheckoutMessage(message, isError = true) {
  const element = $('#checkoutMessage');
  element.textContent = message;
  element.hidden = !message;
  element.classList.toggle('success', !isError);
}

function setRequired(element, required) {
  element.required = required;
}

function setAddressFormVisible(visible) {
  const addressForm = $('#addressForm');
  addressForm.hidden = !visible;
  $$('input', addressForm).forEach(input => {
    if (input.type !== 'checkbox') setRequired(input, visible);
  });
  $('#saveAddressOption').hidden = !visible || !session;
}

function render() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  $('#cartCount').textContent = totalQty;
  $('#cartCount').classList.toggle('show', totalQty > 0);

  const empty = cart.length === 0;
  $('#emptyView').hidden = !empty;
  $('#filledView').hidden = empty;
  if (empty) return;

  const list = $('#cartList');
  list.replaceChildren();
  cart.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'cart-item';

    const top = document.createElement('div');
    top.className = 'ci-top';
    const image = document.createElement('div');
    image.className = 'ci-img';
    image.textContent = item.emoji || '🍕';
    const info = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'ci-name';
    name.textContent = item.name;
    const remove = document.createElement('button');
    remove.className = 'ci-remove';
    remove.type = 'button';
    remove.textContent = 'ลบออก';
    remove.addEventListener('click', () => {
      cart.splice(index, 1);
      saveCart();
      render();
    });
    info.append(name, remove);
    top.append(image, info);

    const bottom = document.createElement('div');
    bottom.className = 'ci-bottom';
    const quantity = document.createElement('div');
    quantity.className = 'qty';
    const decrement = document.createElement('button');
    decrement.type = 'button';
    decrement.textContent = '−';
    decrement.disabled = item.qty <= 1;
    decrement.setAttribute('aria-label', 'ลดจำนวน');
    decrement.addEventListener('click', () => {
      if (item.qty > 1) {
        item.qty -= 1;
        saveCart();
        render();
      }
    });
    const count = document.createElement('span');
    count.textContent = item.qty;
    const increment = document.createElement('button');
    increment.type = 'button';
    increment.textContent = '+';
    increment.setAttribute('aria-label', 'เพิ่มจำนวน');
    increment.addEventListener('click', () => {
      if (item.qty < 99) {
        item.qty += 1;
        saveCart();
        render();
      }
    });
    quantity.append(decrement, count, increment);
    const price = document.createElement('div');
    price.className = 'ci-price';
    price.textContent = money((Number(item.price) || 0) * item.qty);
    bottom.append(quantity, price);
    row.append(top, bottom);
    list.appendChild(row);
  });

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.qty, 0);
  const delivery = mode === 'เดลิเวอรี';
  const freeDelivery = delivery && subtotal >= FREE_DELIVERY_MIN;
  $('#itemCount').textContent = `${totalQty} รายการ`;
  $('#subtotal').textContent = money(subtotal);
  $('#feeRow').hidden = !delivery;
  $('#fee').textContent = freeDelivery ? 'ฟรี' : money(delivery ? DELIVERY_FEE : 0);
  $('#grand').textContent = money(subtotal + (delivery && !freeDelivery ? DELIVERY_FEE : 0));
  $('#deliveryNote').hidden = !delivery;
  $('#pickupNote').hidden = delivery;
}

function renderAddressOptions() {
  const select = $('#savedAddressSelect');
  select.replaceChildren();

  const choose = document.createElement('option');
  choose.value = '';
  choose.textContent = 'เลือกที่อยู่จัดส่ง';
  select.appendChild(choose);

  addresses.forEach(address => {
    const option = document.createElement('option');
    option.value = address.id;
    option.textContent = `${address.label || 'ที่อยู่จัดส่ง'} — ${address.address_line}, ${address.district}, ${address.province}`;
    select.appendChild(option);
  });

  const addNew = document.createElement('option');
  addNew.value = NEW_ADDRESS;
  addNew.textContent = 'ใช้ที่อยู่ใหม่';
  select.appendChild(addNew);
  select.value = addresses.length ? '' : NEW_ADDRESS;
  $('#savedAddressFields').hidden = !session;
  $('#newAddressButton').hidden = !session || !addresses.length;
  setAddressFormVisible(!session || !addresses.length);
}

function updateCheckoutFields() {
  const delivery = mode === 'เดลิเวอรี';
  $('#deliveryFields').hidden = !delivery;
  $('#guestAuthPrompt').hidden = Boolean(session);

  const metadata = session?.user?.user_metadata || {};
  const savedName = metadata.full_name || '';
  const savedPhone = metadata.phone || '';
  const showPickupContact = !session || !savedName || !savedPhone;
  $('#pickupContactFields').hidden = delivery || !showPickupContact;
  setRequired($('#pickupName'), !delivery && showPickupContact);
  setRequired($('#pickupPhone'), !delivery && showPickupContact);

  if (session && !delivery && !$('#pickupName').value) $('#pickupName').value = savedName;
  if (session && !delivery && !$('#pickupPhone').value) $('#pickupPhone').value = savedPhone;

  if (!delivery) {
    $('#memberStatus').textContent = session
      ? `สมาชิก: ${session.user.email || ''}`
      : 'สั่งซื้อแบบไม่สมัครสมาชิกได้ โดยกรอกข้อมูลติดต่อ';
  } else {
    $('#memberStatus').textContent = session
      ? `สมาชิก: ${session.user.email || ''} — เลือกที่อยู่ที่ต้องการจัดส่ง`
      : 'กรอกชื่อผู้รับ เบอร์โทรศัพท์ และที่อยู่สำหรับจัดส่ง';
  }
}

async function loadSessionAndAddresses() {
  const client = getPizzaSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  session = data.session;
  updateCheckoutFields();

  if (session) {
    const { data: rows, error: addressError } = await client
      .from('addresses')
      .select('id,label,recipient_name,phone,address_line,subdistrict,district,province,postal_code')
      .order('created_at', { ascending: false });
    if (addressError) throw addressError;
    addresses = rows || [];
  }

  updateCheckoutFields();
  renderAddressOptions();
}

function addressPayloadFromForm() {
  return {
    label: 'ที่อยู่จัดส่ง',
    recipient_name: $('#addressRecipient').value.trim(),
    phone: $('#addressPhone').value.trim(),
    address_line: $('#addressLine').value.trim(),
    subdistrict: $('#addressSubdistrict').value.trim(),
    district: $('#addressDistrict').value.trim(),
    province: $('#addressProvince').value.trim(),
    postal_code: $('#addressPostalCode').value.trim(),
  };
}

function setFormBusy(busy) {
  checkoutBusy = busy;
  $('#payBtn').disabled = busy;
  $('#payBtn').querySelector('span').textContent = busy ? 'กำลังส่งคำสั่งซื้อ…' : 'ยืนยันคำสั่งซื้อ';
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function idempotencyKeyFor(body) {
  const fingerprint = await sha256(JSON.stringify(body));
  const storageKey = 'pizzaCheckoutRetry';
  try {
    const previous = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (previous?.fingerprint === fingerprint && UUID_PATTERN.test(previous.key)) return previous.key;
    const key = crypto.randomUUID();
    sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint, key }));
    return key;
  } catch (error) {
    throw new Error('เบราว์เซอร์ไม่อนุญาตให้บันทึกข้อมูลการลองส่งซ้ำ กรุณาเปิด session storage แล้วลองใหม่');
  }
}

function makeCheckoutBody() {
  if (!cart.length) throw new Error('ไม่มีสินค้าในตะกร้า');
  const items = cart.map(item => {
    if (!item.product_id) throw new Error(`ไม่พบรหัสสินค้าของ "${item.name}" กรุณาลบแล้วเพิ่มสินค้านี้ใหม่`);
    return { product_id: item.product_id, quantity: item.qty };
  });

  const body = {
    fulfillment: mode === 'เดลิเวอรี' ? 'delivery' : 'pickup',
    items,
  };

  if (body.fulfillment === 'pickup') {
    const metadata = session?.user?.user_metadata || {};
    body.customer = {
      name: (metadata.full_name || $('#pickupName').value).trim(),
      phone: (metadata.phone || $('#pickupPhone').value).trim(),
    };
    return body;
  }

  if (session && $('#savedAddressSelect').value && $('#savedAddressSelect').value !== NEW_ADDRESS) {
    body.address_id = $('#savedAddressSelect').value;
    return body;
  }

  body.address = addressPayloadFromForm();
  body.save_address = Boolean(session && $('#saveAddress').checked);
  return body;
}

$('#payBtn').addEventListener('click', async () => {
  if (checkoutBusy) return;
  showCheckoutMessage('');
  if (!$('#pickupContactFields').hidden) {
    const pickupInputs = $$('#pickupContactFields input');
    for (const input of pickupInputs) {
      if (!input.reportValidity()) return;
    }
  }
  if (mode === 'เดลิเวอรี' && !$('#addressForm').hidden) {
    for (const input of $$('input:not([type="checkbox"])', $('#addressForm'))) {
      if (!input.reportValidity()) return;
    }
  }
  if (mode === 'เดลิเวอรี' && session && !$('#savedAddressSelect').value) {
    showCheckoutMessage('กรุณาเลือกที่อยู่จัดส่ง');
    return;
  }

  setFormBusy(true);
  try {
    const body = makeCheckoutBody();
    const key = await idempotencyKeyFor(body);
    const requestBody = { ...body, idempotency_key: key };
    const response = await fetch(`${window.PIZZA_SUPABASE_URL}/functions/v1/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: window.PIZZA_SUPABASE_ANON_KEY,
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(requestBody),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `checkout_failed_${response.status}`);

    cart = [];
    const cartCleared = saveCart();
    try {
      sessionStorage.removeItem('pizzaCheckoutRetry');
    } catch (error) {
      console.error('Could not clear checkout retry key:', error);
    }
    render();
    $('#emptyMessage').hidden = true;
    $('#orderSuccessMessage').textContent = [
      `รับคำสั่งซื้อแล้ว เลขที่คำสั่งซื้อ ${result.order.order_id}`,
      `สถานะ: ${result.order.status}`,
      cartCleared ? '' : 'ไม่สามารถล้างตะกร้าที่บันทึกในเบราว์เซอร์ได้ กรุณาอย่าส่งคำสั่งซ้ำ',
    ].filter(Boolean).join(' — ');
    $('#orderSuccessMessage').hidden = false;
  } catch (error) {
    showCheckoutMessage(error.message || 'ส่งคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่');
  } finally {
    setFormBusy(false);
  }
});

$('#savedAddressSelect').addEventListener('change', () => {
  const isNew = $('#savedAddressSelect').value === NEW_ADDRESS;
  setAddressFormVisible(isNew);
});

$('#newAddressButton').addEventListener('click', () => {
  $('#savedAddressSelect').value = NEW_ADDRESS;
  setAddressFormVisible(true);
});

$('#addReward').addEventListener('click', event => {
  event.preventDefault();
  showCheckoutMessage('ฟีเจอร์รีวอร์ดสยังไม่พร้อมใช้งาน');
});

const modal = $('#modal');
$('#changeBtn').addEventListener('click', () => modal.classList.add('open'));
$('#cancelBtn').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', event => {
  if (event.target === modal) modal.classList.remove('open');
});

$$('.seg-btn').forEach(button => {
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    $$('.seg-btn').forEach(item => item.classList.toggle('active', item === button));
  });
});

$('#saveBtn').addEventListener('click', () => {
  const store = {
    mode,
    store: $('#storeSelect').value,
    time: $('#timeSelect').value,
  };
  try {
    localStorage.setItem('pizzaStore', JSON.stringify(store));
  } catch (error) {
    showCheckoutMessage('บันทึกการเลือกวิธีรับสินค้าไม่ได้');
  }
  $('#modeText').textContent = store.mode;
  $('#storeText').textContent = store.store;
  $('#timeText').textContent = store.time;
  modal.classList.remove('open');
  updateCheckoutFields();
  render();
});

async function initializeCheckout() {
  render();
  renderAddressOptions();
  updateCheckoutFields();
  try {
    await loadSessionAndAddresses();
    $('#payBtn').disabled = false;
  } catch (error) {
    $('#payBtn').disabled = true;
    showCheckoutMessage(error.message || 'เชื่อมต่อระบบสมาชิกไม่ได้ กรุณาตรวจสอบการตั้งค่า');
  }
}

initializeCheckout();
