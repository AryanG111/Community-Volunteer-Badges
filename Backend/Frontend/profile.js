const API_BASE_URL = ''; // Now relative since backend serves frontend
const messageEl = document.getElementById('message');
const logoutBtn = document.getElementById('logout-btn');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const participationCountEl = document.getElementById('participation-count');
const profileNote = document.getElementById('profile-note');
const badgeProgressEl = document.getElementById('badge-progress');
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
        const statusLabel = registration.status ? registration.status.charAt(0).toUpperCase() + registration.status.slice(1) : 'Registered';
        li.innerHTML = `
          <strong>${registration.event.title}</strong>
          <div>${formatDate(registration.event.date)} • ${registration.event.location}</div>
          <div>${registration.event.description}</div>
          <div>Status: ${statusLabel}</div>
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
    participationCountEl.textContent = data.attendedCount ?? 0;
    const registeredCountEl = document.getElementById('registered-count');
    if (registeredCountEl) {
      registeredCountEl.textContent = data.registrationsCount ?? 0;
    }

    if (profileNote) {
      if ((data.registrationsCount ?? 0) > 0 && (data.attendedCount ?? 0) === 0) {
        profileNote.textContent = 'You have registered for events, but badges are awarded only after attendance is marked completed by an admin.';
        profileNote.classList.add('info');
      } else {
        profileNote.textContent = '';
        profileNote.classList.remove('info');
      }
    }

    if (badgeProgressEl) {
      const attended = data.attendedCount ?? 0;
      let progressText = 'Bronze badge awarded after completing 1 event. Silver badge awarded after 3 events. Gold badge awarded after 5+ events.';

      if (attended === 0) {
        progressText = 'Complete 1 attended event to earn Bronze.';
      } else if (attended === 1) {
        progressText = 'Great start! Attend 2 more events to earn Silver.';
      } else if (attended === 2) {
        progressText = 'Almost there! Attend 1 more event to earn Silver.';
      } else if (attended === 3) {
        progressText = 'Nice work! Attend 2 more events to earn Gold.';
      } else if (attended === 4) {
        progressText = 'One more attended event and you will earn Gold.';
      } else if (attended >= 5) {
        progressText = 'You have reached Gold milestone and earned the highest badge tier.';
      }

      badgeProgressEl.textContent = progressText;
    }

    const badgeItems = renderList(
      badgeList,
      data.badges,
      (badge) => {
        const li = document.createElement('li');
        const badgeType = (badge.badge && badge.badge.type) ? badge.badge.type.toLowerCase() : badge.name.toLowerCase();
        const iconMap = {
          bronze: '🥉',
          silver: '🥈',
          gold: '🥇'
        };
        const icon = iconMap[badgeType] || '🏅';

        li.className = `badge-item badge-${badgeType}`;
        li.innerHTML = `
          <div class="badge-header">
            <span class="badge-icon">${icon}</span>
            <div>
              <strong>${badge.name}</strong>
              <div class="small-text">Earned ${formatDate(badge.earnedAt)}</div>
            </div>
          </div>
        `;
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
