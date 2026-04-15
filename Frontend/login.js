const form = document.getElementById('login-form');
const messageEl = document.getElementById('message');

const API_BASE_URL = 'http://localhost:5000';

const getUserRole = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    const data = await response.json();
    return data.role;
  } catch (error) {
    return 'normal';
  }
};

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
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    messageEl.textContent = data.message || 'Login successful!';
    messageEl.classList.add('success');
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      const role = await getUserRole(data.token);
      const redirectPage = role === 'admin' ? 'admin.html' : 'profile.html';
      window.location.href = redirectPage;
    }

    form.reset();
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.classList.add('error');
  }
});
