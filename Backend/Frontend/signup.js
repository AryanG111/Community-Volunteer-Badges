const form = document.getElementById('signup-form');
const messageEl = document.getElementById('message');
const passwordError = document.getElementById('password-error');
const submitBtn = document.getElementById('submit-btn');

const API_BASE_URL = ''; // Relative path

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const password = form.password.value;

  // Reset messages
  messageEl.textContent = '';
  messageEl.className = 'message';
  passwordError.style.display = 'none';

  // Basic validation
  let hasError = false;

  if (password.length < 8) {
    passwordError.style.display = 'block';
    hasError = true;
  }

  if (!name || !email || !phone || !password) {
    messageEl.textContent = 'Please fill in all fields.';
    messageEl.classList.add('error');
    hasError = true;
  }

  if (hasError) return;

  // Disable button and show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating Account...';

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, phone, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed.');
    }

    messageEl.textContent = 'Registration successful! Redirecting to login...';
    messageEl.classList.add('success');
    
    // Clear form
    form.reset();

    // Redirect to login page after a short delay
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);

  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.classList.add('error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign Up';
  }
});
