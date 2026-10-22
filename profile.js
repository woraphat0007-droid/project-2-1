const passwordInput = document.querySelector('#password');
const passwordToggle = document.querySelector('#passwordToggle');
const loginForm = document.querySelector('#loginForm');
const loginMessage = document.querySelector('#loginMessage');
const forgotPassword = document.querySelector('#forgotPassword');
const cartCount = document.querySelector('#cartCount');
const memberPanel = document.querySelector('#memberPanel');
const memberEmail = document.querySelector('#memberEmail');
const signupPrompt = document.querySelector('#signupPrompt');
const signOutButton = document.querySelector('#signOutButton');

function showMessage(message) {
  loginMessage.textContent = message;
  loginMessage.hidden = false;
}

function redirectAfterAuth() {
  const redirect = new URLSearchParams(window.location.search).get('redirect');
  window.location.href = redirect === 'cart.html' ? 'cart.html' : 'index.html';
}

forgotPassword.addEventListener('click', async () => {
  const email = document.querySelector('#username').value.trim();
  if (!email.includes('@')) {
    showMessage('กรุณากรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่');
    return;
  }

  try {
    const { error } = await getPizzaSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile.html`,
    });
    if (error) throw error;
    showMessage('ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลแล้ว');
  } catch (error) {
    showMessage(error.message || 'ส่งลิงก์ไม่สำเร็จ กรุณาลองใหม่');
  }
});

passwordToggle.addEventListener('click', () => {
  const isPasswordHidden = passwordInput.type === 'password';
  passwordInput.type = isPasswordHidden ? 'text' : 'password';
  passwordToggle.textContent = isPasswordHidden ? 'ซ่อน' : 'แสดง';
  passwordToggle.setAttribute('aria-label', isPasswordHidden ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
  passwordToggle.setAttribute('aria-pressed', String(isPasswordHidden));
});

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const identifier = document.querySelector('#username').value.trim();
  const password = passwordInput.value;
  const credentials = { email: identifier, password };

  try {
    const { error } = await getPizzaSupabase().auth.signInWithPassword(credentials);
    if (error) throw error;
    redirectAfterAuth();
  } catch (error) {
    showMessage(error.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูล');
  }
});

signOutButton.addEventListener('click', async () => {
  try {
    const { error } = await getPizzaSupabase().auth.signOut();
    if (error) throw error;
    window.location.reload();
  } catch (error) {
    showMessage(error.message || 'ออกจากระบบไม่สำเร็จ กรุณาลองใหม่');
  }
});

async function loadMemberSession() {
  try {
    const { data, error } = await getPizzaSupabase().auth.getSession();
    if (error) throw error;
    if (!data.session) return;
    loginForm.hidden = true;
    signupPrompt.hidden = true;
    memberPanel.hidden = false;
    memberEmail.textContent = `เข้าสู่ระบบแล้ว: ${data.session.user.email || data.session.user.phone || ''}`;
  } catch (error) {
    showMessage(error.message || 'โหลดสถานะสมาชิกไม่สำเร็จ');
  }
}

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

loadMemberSession();
