const passwordInput = document.querySelector('#password');
const passwordToggle = document.querySelector('#passwordToggle');
const loginForm = document.querySelector('#loginForm');
const loginMessage = document.querySelector('#loginMessage');
const forgotPassword = document.querySelector('#forgotPassword');
const cartCount = document.querySelector('#cartCount');

forgotPassword.addEventListener('click', () => {
  loginMessage.textContent = 'ระบบกู้คืนรหัสผ่านยังไม่ได้เชื่อมต่อ';
  loginMessage.hidden = false;
});

passwordToggle.addEventListener('click', () => {
  const isPasswordHidden = passwordInput.type === 'password';
  passwordInput.type = isPasswordHidden ? 'text' : 'password';
  passwordToggle.textContent = isPasswordHidden ? 'ซ่อน' : 'แสดง';
  passwordToggle.setAttribute('aria-label', isPasswordHidden ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
  passwordToggle.setAttribute('aria-pressed', String(isPasswordHidden));
});

loginForm.addEventListener('submit', event => {
  event.preventDefault();
  loginMessage.textContent = 'แบบฟอร์มนี้ยังไม่ได้เชื่อมต่อกับระบบสมาชิก';
  loginMessage.hidden = false;
});

try {
  const cart = JSON.parse(localStorage.getItem('pizzaCart') || '[]');
  const itemCount = Array.isArray(cart)
    ? cart.reduce((total, item) => total + (Number(item.qty) || 1), 0)
    : 0;
  cartCount.textContent = itemCount;
  cartCount.classList.toggle('show', itemCount > 0);
} catch (error) {
  cartCount.textContent = '0';
  cartCount.classList.remove('show');
}
