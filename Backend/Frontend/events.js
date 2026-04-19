const API_BASE_URL = ''; // Now relative since backend serves frontend
const messageEl = document.getElementById('message');
const logoutBtn = document.getElementById('logout-btn');
const eventsGrid = document.getElementById('events-grid');
const loadingEl = document.getElementById('loading');

const token = localStorage.getItem('token');

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const redirectToLogin = () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
};

const isEventUpcoming = (eventDate) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventTime = new Date(eventDate);
  const eventDay = new Date(eventTime.getFullYear(), eventTime.getMonth(), eventTime.getDate());
  return eventDay >= today;
};

const setMessage = (text, type) => {
  messageEl.textContent = text;
  messageEl.className = 'message';
  if (type) messageEl.classList.add(type);
};

const fetchRegisteredEventIds = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/registrations/my`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) return [];
    const registrations = await response.json();
    return registrations.map((registration) => registration.event?._id).filter(Boolean);
  } catch {
    return [];
  }
};

const handleRegistration = async (event) => {
  const button = event.target;
  const eventId = button.dataset.eventId;
  const originalText = button.textContent;

  if (!token) {
    redirectToLogin();
    return;
  }

  button.disabled = true;
  button.textContent = 'Registering...';

  try {
    const response = await fetch(`${API_BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ eventId })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    button.textContent = 'Registered!';
    button.classList.add('success');
    setMessage(`Successfully registered for "${button.closest('.event-card').querySelector('h3').textContent}". Check your profile for details.`, 'success');

    const slotsElement = button.closest('.event-card').querySelector('.detail-row:last-child .detail-value');
    if (slotsElement) {
      const [available, total] = slotsElement.textContent.split('/').map((value) => parseInt(value.trim(), 10));
      slotsElement.textContent = `${Math.max(0, available - 1)}/${total}`;
    }

    setTimeout(() => setMessage('', null), 5000);
  } catch (error) {
    button.disabled = false;
    button.textContent = originalText;
    setMessage(error.message, 'error');
    setTimeout(() => setMessage('', null), 3000);
  }
};

const loadEvents = async () => {
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const startTime = performance.now();

    const [eventsResponse, registeredIds] = await Promise.all([
      fetch(`${API_BASE_URL}/api/events`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }),
      fetchRegisteredEventIds()
    ]);

    if (!eventsResponse.ok) {
      throw new Error('Unable to load events.');
    }

    const events = await eventsResponse.json();
    const upcomingEvents = events
      .filter((event) => isEventUpcoming(event.date))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    loadingEl.remove();

    if (upcomingEvents.length === 0) {
      eventsGrid.innerHTML = '<div class="empty-state-message">No upcoming events at the moment. Check back soon!</div>';
      return;
    }

    const eventCards = upcomingEvents.map((event) => {
      const isRegistered = registeredIds.includes(event._id);
      const disabled = isRegistered || event.availableSlots <= 0;
      const buttonText = isRegistered ? 'Registered' : event.availableSlots <= 0 ? 'Full' : 'Register';

      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <div class="event-card-header">
          <h3>${event.title}</h3>
        </div>
        <div class="event-card-body">
          <p class="event-description">${event.description}</p>
          <div class="event-details">
            <div class="detail-row">
              <span class="detail-label">📅 Date</span>
              <span class="detail-value">${formatDate(event.date)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📍 Location</span>
              <span class="detail-value">${event.location}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">👥 Available slots</span>
              <span class="detail-value">${event.availableSlots}/${event.maxSlots}</span>
            </div>
          </div>
        </div>
        <div class="event-card-footer">
          <button class="register-btn" data-event-id="${event._id}" ${disabled ? 'disabled' : ''}>
            ${buttonText}
          </button>
        </div>
      `;
      return card;
    });

    eventsGrid.replaceChildren(...eventCards);

    document.querySelectorAll('.register-btn').forEach((btn) => {
      if (!btn.disabled) {
        btn.addEventListener('click', handleRegistration);
      }
    });

    const endTime = performance.now();
    console.log(`Events loaded in ${(endTime - startTime).toFixed(2)}ms`);
  } catch (error) {
    loadingEl.remove();
    setMessage(error.message, 'error');
  }
};

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

window.addEventListener('DOMContentLoaded', loadEvents);
