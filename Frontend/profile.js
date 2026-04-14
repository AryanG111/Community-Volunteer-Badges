const API_BASE_URL = 'http://localhost:5000';
const messageEl = document.getElementById('message');
const logoutBtn = document.getElementById('logout-btn');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const participationCountEl = document.getElementById('participation-count');
const badgeList = document.getElementById('badge-list');
const eventsList = document.getElementById('events-list');

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

const renderList = (container, items, renderItem, emptyText) => {
  if (!items || items.length === 0) {
    const li = document.createElement('li');
    li.textContent = emptyText;
    container.parentElement.classList.add('empty-state');
    return [li];
  }

  return items.map(renderItem);
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
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.classList.add('error');
    setTimeout(redirectToLogin, 1500);
  }
};

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

window.addEventListener('DOMContentLoaded', loadProfile);
