const API_BASE_URL = ''; // Now relative since backend serves frontend
const messageEl = document.getElementById('message');
const logoutBtn = document.getElementById('logout-btn');
const createEventForm = document.getElementById('create-event-form');
const activeEventsList = document.getElementById('active-events-list');
const registrationsList = document.getElementById('registrations-list');

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

const loadRegistrations = async () => {
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/registrations`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Unable to load registrations.');
    }

    const registrations = await response.json();
    const registrationItems = renderList(
      registrationsList,
      registrations,
      (registration) => {
        const li = document.createElement('li');
        const statusLabel = registration.status ? registration.status.charAt(0).toUpperCase() + registration.status.slice(1) : 'Registered';
        const attendedButton = registration.status !== 'attended' ? `<button class="status-btn" data-id="${registration._id}" data-status="attended">Mark attended</button>` : '';
        const cancelButton = registration.status !== 'cancelled' ? `<button class="status-btn" data-id="${registration._id}" data-status="cancelled">Cancel</button>` : '';

        li.innerHTML = `
          <strong>${registration.event.title}</strong>
          <div>${formatDate(registration.event.date)} • ${registration.event.location}</div>
          <div>User: ${registration.user.name || registration.user.email}</div>
          <div>Status: ${statusLabel}</div>
          <div class="button-row">${attendedButton}${cancelButton}</div>
        `;
        return li;
      },
      'No registrations found.'
    );

    registrationsList.replaceChildren(...registrationItems);
    document.querySelectorAll('.status-btn').forEach((button) => {
      button.addEventListener('click', async (event) => {
        const btn = event.target;
        const registrationId = btn.dataset.id;
        const status = btn.dataset.status;
        await updateRegistrationStatus(registrationId, status);
      });
    });
  } catch (error) {
    setMessage(error.message, 'error');
  }
};

const updateRegistrationStatus = async (registrationId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/registrations/${registrationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Unable to update registration status.');
    }

    setMessage(data.message, 'success');
    await loadRegistrations();
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
  await loadRegistrations();
});