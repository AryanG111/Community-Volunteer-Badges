const API_BASE_URL = 'http://localhost:5000';
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
  const eventTime = new Date(eventDate);
  return eventTime >= now;
};

const handleRegistration = async (event) => {
  const button = event.target;
  const eventId = button.dataset.eventId;
  const originalText = button.textContent;

  if (!token) {
    redirectToLogin();
    return;
  }

  // Disable button and show loading state
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

    // Success - update button and show message
    button.textContent = 'Registered!';
    button.classList.add('success');
    messageEl.textContent = `Successfully registered for "${button.closest('.event-card').querySelector('h3').textContent}". Check your profile for details.`;
    messageEl.className = 'message success';

    // Update available slots display
    const slotsElement = button.closest('.event-card').querySelector('.detail-value');
    const currentSlots = slotsElement.textContent.split('/');
    const newAvailable = parseInt(currentSlots[0]) - 1;
    slotsElement.textContent = `${newAvailable}/${currentSlots[1]}`;

    // Disable button permanently
    button.disabled = true;

    // Clear message after 5 seconds
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = 'message';
    }, 5000);

  } catch (error) {
    // Error - restore button state
    button.disabled = false;
    button.textContent = originalText;
    messageEl.textContent = error.message;
    messageEl.className = 'message error';

    // Clear error message after 3 seconds
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = 'message';
    }, 3000);
  }
};

const loadEvents = async () => {
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const startTime = performance.now();

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

    // Filter to show only upcoming events and sort by date
    const upcomingEvents = events
      .filter(event => isEventUpcoming(event.date))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    loadingEl.remove();

    if (upcomingEvents.length === 0) {
      eventsGrid.innerHTML = '<div class="empty-state-message">No upcoming events at the moment. Check back soon!</div>';
      return;
    }

    const eventCards = upcomingEvents.map(event => {
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
          <button class="register-btn" data-event-id="${event._id}" ${event.availableSlots <= 0 ? 'disabled' : ''}>
            ${event.availableSlots <= 0 ? 'Full' : 'Register'}
          </button>
        </div>
      `;
      return card;
    });

    eventsGrid.replaceChildren(...eventCards);

    // Add event listeners for register buttons
    document.querySelectorAll('.register-btn').forEach(btn => {
      btn.addEventListener('click', handleRegistration);
    });

    const endTime = performance.now();
    console.log(`Events loaded in ${(endTime - startTime).toFixed(2)}ms`);
  } catch (error) {
    loadingEl.remove();
    messageEl.textContent = error.message;
    messageEl.classList.add('error');
  }
};
    loadingEl.remove();
    messageEl.textContent = error.message;
    messageEl.classList.add('error');
  }
};

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

window.addEventListener('DOMContentLoaded', loadEvents);
