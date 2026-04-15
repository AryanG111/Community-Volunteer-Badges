const API_BASE_URL = 'http://localhost:5000';
const messageEl = document.getElementById('message');
const logoutBtn = document.getElementById('logout-btn');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const participationCountEl = document.getElementById('participation-count');
const badgeList = document.getElementById('badge-list');
const eventsList = document.getElementById('events-list');
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

const setMessage = (element, text, type) => {
  element.textContent = text;
  element.className = 'message';
  if (type) element.classList.add(type);
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
    setMessage(messageEl, error.message, 'error');
  }
};

const loadRegistrations = async () => {
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/registrations/my`, {
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
        li.innerHTML = `
          <strong>${registration.event.title}</strong>
          <div>${formatDate(registration.event.date)} • ${registration.event.location}</div>
          <div>${registration.event.description}</div>
          <div>Registered on ${formatDate(registration.registeredAt)}</div>
        `;
        return li;
      },
      'No registrations yet.'
    );

    registrationsList.replaceChildren(...registrationItems);
  } catch (error) {
    setMessage(messageEl, error.message, 'error');
  }
};

const loadProfile = async () => {
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
      throw new Error('Unable to load profile. Please log in again.');
    }

    const data = await response.json();

    profileName.textContent = data.name || 'Volunteer';
    profileEmail.textContent = data.email;
    participationCountEl.textContent = data.participationCount ?? 0;

    const badgeItems = renderList(
      badgeList,
      data.badges,
      (badge) => {
        const li = document.createElement('li');
        li.textContent = `${badge.name} • earned ${formatDate(badge.earnedAt)}`;
        return li;
      },
      'No badges earned yet.'
    );

    badgeList.replaceChildren(...badgeItems);

    const eventItems = renderList(
      eventsList,
      data.eventsAttended,
      (event) => {
        const li = document.createElement('li');
        li.textContent = `${event.title} • ${formatDate(event.date)}${event.location ? ` • ${event.location}` : ''}`;
        return li;
      },
      'No events attended yet.'
    );

    eventsList.replaceChildren(...eventItems);

    await loadEvents();
    await loadRegistrations();
  } catch (error) {
    setMessage(messageEl, error.message, 'error');
    setTimeout(redirectToLogin, 1500);
  }
};


logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

window.addEventListener('DOMContentLoaded', loadProfile);
