const registerForm = document.querySelector('#registerForm');
const passwordInputs = ['password', 'confirmPassword'].map(id => document.getElementById(id));
const registerMessage = document.querySelector('#registerMessage');
const cartCount = document.querySelector('#cartCount');
const termsLink = document.querySelector('#termsLink');

document.querySelectorAll('[data-password-toggle]').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const input = document.getElementById(toggle.dataset.passwordToggle);
    const isPasswordHidden = input.type === 'password';
    input.type = isPasswordHidden ? 'text' : 'password';
    toggle.textContent = isPasswordHidden ? 'ซ่อน' : 'แสดง';
    toggle.setAttribute('aria-label', isPasswordHidden ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
    toggle.setAttribute('aria-pressed', String(isPasswordHidden));
  });
});

termsLink.addEventListener('click', event => {
  event.preventDefault();
  registerMessage.textContent = 'ข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัวยังไม่ได้ระบุ';
  registerMessage.hidden = false;
});

registerForm.addEventListener('submit', async event => {
  event.preventDefault();

  if (passwordInputs[0].value !== passwordInputs[1].value) {
    registerMessage.textContent = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง';
    registerMessage.hidden = false;
    passwordInputs[1].setCustomValidity('รหัสผ่านไม่ตรงกัน');
    passwordInputs[1].reportValidity();
    return;
  }

  passwordInputs[1].setCustomValidity('');
  const formData = new FormData(registerForm);
  try {
    const { data, error } = await getPizzaSupabase().auth.signUp({
      email: formData.get('email').trim(),
      password: passwordInputs[0].value,
      options: {
        data: {
          full_name: formData.get('fullName').trim(),
          phone: formData.get('phone').trim(),
        },
      },
    });
    if (error) throw error;
    if (data.session) {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      window.location.href = redirect === 'cart.html' ? 'cart.html' : 'index.html';
      return;
    }
    if (data.user) {
      registerMessage.textContent = data.user.identities?.length === 0
        ? 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ'
        : 'บัญชีถูกสร้างแล้ว แต่ Supabase ยังเปิดยืนยันอีเมลอยู่ กรุณาปิด Confirm email ที่ Supabase Dashboard → Authentication → Sign In / Providers → Email แล้วให้ผู้ดูแลยืนยันบัญชีนี้ก่อนเข้าสู่ระบบ';
    } else {
      registerMessage.textContent = 'สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่';
    }
    registerMessage.hidden = false;
  } catch (error) {
    registerMessage.textContent = error.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่';
    registerMessage.hidden = false;
  }
});

passwordInputs[1].addEventListener('input', () => passwordInputs[1].setCustomValidity(''));

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
