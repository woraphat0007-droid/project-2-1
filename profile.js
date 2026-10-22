const passwordInput = document.querySelector('#password');
const passwordToggle = document.querySelector('#passwordToggle');
const loginForm = document.querySelector('#loginForm');
const loginMessage = document.querySelector('#loginMessage');
const forgotPassword = document.querySelector('#forgotPassword');
const resendConfirmation = document.querySelector('#resendConfirmation');
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

function authRedirectMessage() {
  const confirmed = new URLSearchParams(window.location.search).get('confirmed');
  if (confirmed === '1') {
    showMessage('ยืนยันอีเมลสำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน');
    return;
  }

  const authError = new URLSearchParams(window.location.hash.slice(1));
  if (authError.get('error_code') === 'otp_expired') {
    showMessage('ลิงก์ยืนยันอีเมลหมดอายุหรือถูกใช้ไปแล้ว กรุณากด “ส่งลิงก์ใหม่” ด้านล่างช่องอีเมล');
  }
}

forgotPassword.addEventListener('click', async () => {
  const email = document.querySelector('#username').value.trim();
  if (!email.includes('@')) {
    showMessage('กรุณากรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่');
    return;
  }

  try {
    const { error } = await getPizzaSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: pizzaAuthRedirectUrl('profile.html?recovery=1'),
    });
    if (error) throw error;
    showMessage('ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลแล้ว');
  } catch (error) {
    showMessage(error.message || 'ส่งลิงก์ไม่สำเร็จ กรุณาลองใหม่');
  }
});

resendConfirmation.addEventListener('click', async () => {
  const email = document.querySelector('#username').value.trim();
  if (!email) {
    showMessage('กรุณากรอกอีเมลที่ใช้สมัครสมาชิกก่อน');
    return;
  }

  try {
    const { error } = await getPizzaSupabase().auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: pizzaAuthRedirectUrl('profile.html?confirmed=1'),
      },
    });
    if (error) throw error;
    showMessage('ส่งลิงก์ยืนยันใหม่แล้ว กรุณาตรวจสอบอีเมลและโฟลเดอร์ Junk/Spam');
  } catch (error) {
    showMessage(error.message || 'ส่งลิงก์ยืนยันไม่สำเร็จ กรุณารอสักครู่แล้วลองใหม่');
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
    if (error.code === 'email_not_confirmed') {
      showMessage('อีเมลยังไม่ได้ยืนยัน กรุณายืนยันจากอีเมลก่อนเข้าสู่ระบบ หรือกดส่งลิงก์ใหม่');
    } else if (error.code === 'invalid_credentials') {
      showMessage('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    } else {
      showMessage(error.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่');
    }
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

authRedirectMessage();
loadMemberSession();
