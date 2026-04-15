const API_BASE_URL = 'http://localhost:5000';
const messageEl = document.getElementById('message');
const logoutBtn = document.getElementById('logout-btn');
const createEventForm = document.getElementById('create-event-form');
const activeEventsList = document.getElementById('active-events-list');

const token = localStorage.getItem('token');

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const redirectToLogin = () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
};

const setMessage = (text, type) => {
  messageEl.textContent = text;
  messageEl.className = 'message';
  if (type) messageEl.classList.add(type);
};

const renderList = (container, items, renderItem, emptyText) => {
  if (!items || items.length === 0) {
    const li = document.createElement('li');
    li.textContent = emptyText;
    container.parentElement.classList.add('empty-state');
    return [li];
  }

  return items.map(renderItem);
};

const loadEvents = async () => {
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Unable to load events.');
    }

    const events = await response.json();
    const eventItems = renderList(
      activeEventsList,
      events,
      (event) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${event.title}</strong>
          <div>${formatDate(event.date)} • ${event.location}</div>
          <div>${event.description}</div>
          <div>Max participants: ${event.maxSlots}</div>
        `;
        return li;
      },
      'No upcoming events yet.'
    );

    activeEventsList.replaceChildren(...eventItems);
  } catch (error) {
    setMessage(error.message, 'error');
  }
};

const verifyAdmin = async () => {
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Unable to verify user role.');
    }

    const data = await response.json();
    if (data.role !== 'admin') {
      window.location.href = 'profile.html';
    }
  } catch (error) {
    setMessage(error.message, 'error');
    setTimeout(redirectToLogin, 1200);
  }
};

createEventForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!token) {
    redirectToLogin();
    return;
  }

  const title = createEventForm.title.value.trim();
  const description = createEventForm.description.value.trim();
  const date = createEventForm.date.value;
  const location = createEventForm.location.value.trim();
  const maxParticipants = Number(createEventForm.maxParticipants.value);

  if (!title || !description || !date || !location || !maxParticipants) {
    setMessage('Please fill in every field.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        description,
        date,
        location,
        maxSlots: maxParticipants
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Unable to create event.');
    }

    setMessage('Event created successfully. Volunteers will see it on the homepage.', 'success');
    createEventForm.reset();
    await loadEvents();
  } catch (error) {
    setMessage(error.message, 'error');
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

window.addEventListener('DOMContentLoaded', async () => {
  await verifyAdmin();
  await loadEvents();
});