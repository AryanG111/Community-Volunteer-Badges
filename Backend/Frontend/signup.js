const form = document.getElementById('signup-form');
const messageEl = document.getElementById('message');

const API_BASE_URL = ''; // Now relative since backend serves frontend

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = form.email.value.trim();
  const password = form.password.value.trim();

  messageEl.textContent = '';
  messageEl.className = 'message';

  if (!email || !password) {
    messageEl.textContent = 'Please enter both email and password.';
    messageEl.classList.add('error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed.');
    }

    messageEl.textContent = data.message || 'Signup successful!';
    messageEl.classList.add('success');
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      window.location.href = 'profile.html';
    }

    form.reset();
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.classList.add('error');
  }
});
