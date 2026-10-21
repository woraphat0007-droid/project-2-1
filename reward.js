const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const storeBar = $('#storeBar');
const tabs = $$('.reward-tab');
const sections = tabs.map(tab => document.getElementById(tab.dataset.section));
const modal = $('#modal');
const toastEl = $('#toast');
let mode = 'รับที่ร้าน';
let toastTimer;
let activeTabId = '';

function updateStoreOffset() {
  document.documentElement.style.setProperty('--store-h', `${storeBar.offsetHeight}px`);
  sections.forEach(section => {
    section.style.scrollMarginTop = `${storeBar.offsetHeight + $('#rewardTabs').offsetHeight + 12}px`;
  });
}

function setActiveTab() {
  const line = storeBar.offsetHeight + $('#rewardTabs').offsetHeight + 24;
  let activeSection = sections[0];
  const atPageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  if (atPageBottom) {
    activeSection = sections[sections.length - 1];
  } else {
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= line) activeSection = section;
    });
  }
  tabs.forEach(tab => {
    const active = tab.dataset.section === activeSection.id;
    tab.classList.toggle('active', active);
    if (active && activeTabId !== tab.dataset.section) {
      tab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      activeTabId = tab.dataset.section;
    }
  });
}

tabs.forEach(tab => {
  tab.addEventListener('click', event => {
    event.preventDefault();
    document.getElementById(tab.dataset.section).scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

window.addEventListener('scroll', setActiveTab, { passive: true });
window.addEventListener('resize', updateStoreOffset);
window.addEventListener('load', updateStoreOffset);
updateStoreOffset();
setActiveTab();

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function loadCart() {
  try {
    const value = JSON.parse(localStorage.getItem('pizzaCart') || '[]');
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function updateCartBadge(cart) {
  const count = cart.reduce((total, item) => total + (Number(item.qty) || 1), 0);
  $('#cartCount').textContent = count;
  $('#cartCount').classList.toggle('show', count > 0);
}

$$('[data-add-item]').forEach(button => {
  button.addEventListener('click', () => {
    const cart = loadCart();
    const found = cart.find(item => item.name === button.dataset.name);
    if (found) found.qty = (Number(found.qty) || 1) + 1;
    else cart.push({
      name: button.dataset.name,
      price: Number(button.dataset.price),
      emoji: button.dataset.emoji,
      qty: 1
    });

    try {
      localStorage.setItem('pizzaCart', JSON.stringify(cart));
    } catch (error) {
      showToast('บันทึกตะกร้าไม่ได้ กรุณาลองใหม่');
      return;
    }

    updateCartBadge(cart);
    showToast(`เพิ่ม "${button.dataset.name}" ลงตะกร้าแล้ว`);
  });
});

function openModal(delivery = false) {
  mode = delivery ? 'เดลิเวอรี' : mode;
  $$('.seg-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

$('#changeBtn').addEventListener('click', () => openModal());
$('#deliveryOffer').addEventListener('click', () => openModal(true));
$('#cancelBtn').addEventListener('click', closeModal);
modal.addEventListener('click', event => {
  if (event.target === modal) closeModal();
});

$$('.seg-btn').forEach(button => {
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    $$('.seg-btn').forEach(item => item.classList.toggle('active', item === button));
  });
});

$('#saveBtn').addEventListener('click', () => {
  const store = $('#storeSelect').value;
  const time = $('#timeSelect').value;
  const data = { mode, store, time };

  try {
    localStorage.setItem('pizzaStore', JSON.stringify(data));
  } catch (error) {
    showToast('บันทึกข้อมูลสาขาไม่ได้ กรุณาลองใหม่');
    return;
  }

  $('#modeText').textContent = mode;
  $('#storeText').textContent = store;
  $('#timeText').textContent = time;
  closeModal();
  showToast(mode === 'เดลิเวอรี' ? 'เลือกเดลิเวอรีแล้ว' : 'เลือกการรับที่ร้านแล้ว');
  updateStoreOffset();
});

try {
  const store = JSON.parse(localStorage.getItem('pizzaStore') || 'null');
  if (store) {
    mode = store.mode || mode;
    $('#modeText').textContent = mode;
    $('#storeText').textContent = store.store || $('#storeText').textContent;
    $('#timeText').textContent = store.time || $('#timeText').textContent;
    $('#storeSelect').value = store.store || $('#storeSelect').value;
    $('#timeSelect').value = store.time || $('#timeSelect').value;
    $$('.seg-btn').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
  }
} catch (error) {
  showToast('อ่านข้อมูลสาขาที่บันทึกไว้ไม่ได้');
}

updateCartBadge(loadCart());
