const API_BASE_URL = 'http://localhost:5000';
const messageEl = document.getElementById('message');
const logoutBtn = document.getElementById('logout-btn');
const createEventForm = document.getElementById('create-event-form');
const activeEventsList = document.getElementById('active-events-list');
const registrationsList = document.getElementById('registrations-list');
const usersTableBody = document.getElementById('users-table-body');
const userSearchInput = document.getElementById('user-search');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfoEl = document.getElementById('page-info');

const token = localStorage.getItem('token');
let currentUsersPage = 1;
let usersSearchTerm = '';
const USERS_PER_PAGE = 10;

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

const loadUsers = async (page = 1, search = '') => {
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/users?page=${page}&limit=${USERS_PER_PAGE}&search=${search}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Unable to load volunteer profiles.');
    }

    const data = await response.json();
    const { users, totalPages, currentPage } = data;
    
    currentUsersPage = currentPage;

    if (users.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="4" class="empty-state-message">No volunteers found matching your query.</td></tr>';
      updatePaginationControls(0, 0);
      return;
    }

    const rows = users.map(user => {
      const tr = document.createElement('tr');
      
      const displayName = user.name && user.name.trim() ? user.name : user.email.split('@')[0];
      const eventsCount = user.eventsAttended ? user.eventsAttended.length : 0;
      
      tr.innerHTML = `
        <td><strong>${displayName}</strong>${user.role === 'admin' ? ' <small>(Admin)</small>' : ''}</td>
        <td>${user.email}</td>
        <td>${eventsCount} events</td>
        <td>
          <div class="user-badges-list">
            ${user.badges && user.badges.length > 0 
              ? user.badges.map(b => `<span class="badge-tag">${b.name}</span>`).join('') 
              : '<span class="small-text muted">None</span>'}
          </div>
        </td>
      `;
      return tr;
    });

    usersTableBody.replaceChildren(...rows);
    updatePaginationControls(currentPage, totalPages);
  } catch (error) {
    usersTableBody.innerHTML = `<tr><td colspan="4" class="message error">${error.message}</td></tr>`;
  }
};

const updatePaginationControls = (current, total) => {
  if (total <= 1) {
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    pageInfoEl.textContent = total === 0 ? 'No users' : `Page 1 of 1`;
    return;
  }

  prevPageBtn.disabled = current <= 1;
  nextPageBtn.disabled = current >= total;
  pageInfoEl.textContent = `Page ${current} of ${total}`;
};

let searchTimeout;
userSearchInput?.addEventListener('input', (e) => {
  usersSearchTerm = e.target.value.trim();
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadUsers(1, usersSearchTerm);
  }, 400);
});

prevPageBtn?.addEventListener('click', () => {
  if (currentUsersPage > 1) {
    loadUsers(currentUsersPage - 1, usersSearchTerm);
  }
});

nextPageBtn?.addEventListener('click', () => {
  loadUsers(currentUsersPage + 1, usersSearchTerm);
});

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

const eventSelect = document.getElementById('event-select');
const eventRegistrationsContainer = document.getElementById('event-registrations-container');
const eventInfoDiv = document.getElementById('event-info');
const eventRegistrationsList = document.getElementById('event-registrations-list');

const populateEventSelector = async () => {
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
      throw new Error('Unable to load events for selector.');
    }

    const events = await response.json();
    
    // Clear existing options except the placeholder
    eventSelect.innerHTML = '<option value="">Choose an event...</option>';
    
    // Add events to dropdown
    events.forEach((event) => {
      const option = document.createElement('option');
      option.value = event._id;
      option.textContent = `${event.title} (${formatDate(event.date)})`;
      eventSelect.appendChild(option);
    });
  } catch (error) {
    setMessage(error.message, 'error');
  }
};

const loadEventRegistrations = async (eventId) => {
  if (!token || !eventId) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/registrations/event/${eventId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Unable to load event registrations.');
    }

    const data = await response.json();
    const { event, registrations } = data;

    // Display event info
    eventInfoDiv.innerHTML = `
      <h3>${event.title}</h3>
      <div><strong>Date:</strong> ${formatDate(event.date)}</div>
      <div><strong>Location:</strong> ${event.location}</div>
      <div><strong>Registered Volunteers:</strong> ${event.registrationCount} / ${event.maxSlots}</div>
    `;

    // Display registrations
    const registrationItems = renderList(
      eventRegistrationsList,
      registrations,
      (registration) => {
        const li = document.createElement('li');
        const statusLabel = registration.status ? registration.status.charAt(0).toUpperCase() + registration.status.slice(1) : 'Registered';
        const statusClass = registration.status || 'registered';
        const attendedButton = registration.status !== 'attended' ? `<button class="status-btn" data-id="${registration._id}" data-status="attended">Mark attended</button>` : '';
        const cancelButton = registration.status !== 'cancelled' ? `<button class="status-btn" data-id="${registration._id}" data-status="cancelled">Cancel</button>` : '';

        li.innerHTML = `
          <strong>${registration.user.name || registration.user.email}</strong>
          <div>${registration.user.email}</div>
          <div><span class="registration-status ${statusClass}">${statusLabel}</span></div>
          <div class="button-row">${attendedButton}${cancelButton}</div>
        `;
        return li;
      },
      'No registered volunteers for this event.'
    );

    eventRegistrationsList.replaceChildren(...registrationItems);
    
    // Add event listeners to status buttons
    document.querySelectorAll('#event-registrations-list .status-btn').forEach((button) => {
      button.addEventListener('click', async (event) => {
        const btn = event.target;
        const registrationId = btn.dataset.id;
        const status = btn.dataset.status;
        await updateEventRegistrationStatus(registrationId, status);
      });
    });

    // Show the container
    eventRegistrationsContainer.style.display = 'block';
  } catch (error) {
    setMessage(error.message, 'error');
    eventRegistrationsContainer.style.display = 'none';
  }
};

const updateEventRegistrationStatus = async (registrationId, status) => {
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
    // Reload the event registrations to reflect the changes
    const selectedEventId = eventSelect.value;
    if (selectedEventId) {
      await loadEventRegistrations(selectedEventId);
    }
  } catch (error) {
    setMessage(error.message, 'error');
  }
};

eventSelect?.addEventListener('change', async (e) => {
  const eventId = e.target.value;
  if (eventId) {
    await loadEventRegistrations(eventId);
  } else {
    eventRegistrationsContainer.style.display = 'none';
  }
});

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
  await populateEventSelector();
  await loadRegistrations();
  await loadUsers();
});