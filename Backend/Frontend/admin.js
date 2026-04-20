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
          <button class="view-details-btn" data-id="${event._id}">View details & attendees</button>
        `;
        return li;
      },
      'No upcoming events yet.'
    );

    activeEventsList.replaceChildren(...eventItems);
    
    // Add listeners for view details buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', () => showEventDetails(btn.dataset.id));
    });
  } catch (error) {
    setMessage(error.message, 'error');
  }
};

const eventModal = document.getElementById('event-details-modal');
const closeModal = document.querySelector('.close-modal');

closeModal.onclick = () => {
  eventModal.style.display = 'none';
};

window.onclick = (event) => {
  if (event.target === eventModal) {
    eventModal.style.display = 'none';
  }
};

const showEventDetails = async (eventId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch event details');

    const data = await response.json();
    const { event, registrations, joinedCount } = data;

    document.getElementById('modal-event-title').textContent = event.title;
    document.getElementById('modal-event-info').innerHTML = `
      <strong>Date:</strong> ${formatDate(event.date)}<br>
      <strong>Location:</strong> ${event.location}<br>
      <strong>Description:</strong> ${event.description}<br>
      <strong>Total Capacity:</strong> ${event.maxSlots} slots
    `;
    document.getElementById('modal-joined-count').textContent = joinedCount;

    const volunteersList = document.getElementById('modal-volunteers-list');
    volunteersList.innerHTML = '';

    if (registrations.length === 0) {
      volunteersList.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#64748b;">No volunteers registered yet.</td></tr>';
    } else {
      registrations.forEach(reg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${reg.user.name || 'N/A'}</td>
          <td>${reg.user.email}</td>
          <td><span class="badge-pill ${reg.status}">${reg.status}</span></td>
        `;
        volunteersList.appendChild(tr);
      });
    }

    eventModal.style.display = 'block';
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

const userTableBody = document.getElementById('user-table-body');
const userSearchInput = document.getElementById('user-search');
const userPagination = document.getElementById('user-pagination');

let currentUserPage = 1;
let currentSearch = '';

const loadUsers = async (page = 1, search = '') => {
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/users?page=${page}&limit=10&search=${search}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Unable to load users.');
    }

    const data = await response.json();
    renderUserTable(data.users);
    renderPagination(data.totalPages, data.currentPage);
  } catch (error) {
    setMessage(error.message, 'error');
  }
};

const renderUserTable = (users) => {
  userTableBody.innerHTML = '';

  if (users.length === 0) {
    userTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #64748b;">No users found.</td></tr>';
    return;
  }

  users.forEach((user) => {
    const tr = document.createElement('tr');
    
    // Count events (based on eventsAttended array)
    const eventsCount = user.eventsAttended ? user.eventsAttended.length : 0;
    
    // Format badges
    const badgeHtml = user.badges && user.badges.length > 0 
      ? user.badges.map(b => `<span class="badge-pill ${b.name.toLowerCase()}">${b.name}</span>`).join('')
      : '<span style="color: #94a3b8; font-style: italic;">None</span>';

    tr.innerHTML = `
      <td>${user.name || 'N/A'}</td>
      <td>${user.email}</td>
      <td>${eventsCount}</td>
      <td>${badgeHtml}</td>
    `;
    userTableBody.appendChild(tr);
  });
};

const renderPagination = (totalPages, currentPage) => {
  userPagination.innerHTML = '';
  
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Prev';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    currentUserPage = currentPage - 1;
    loadUsers(currentUserPage, currentSearch);
  });
  userPagination.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    if (i === currentPage) pageBtn.classList.add('active');
    pageBtn.addEventListener('click', () => {
      currentUserPage = i;
      loadUsers(currentUserPage, currentSearch);
    });
    userPagination.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    currentUserPage = currentPage + 1;
    loadUsers(currentUserPage, currentSearch);
  });
  userPagination.appendChild(nextBtn);
};

userSearchInput.addEventListener('input', (e) => {
  currentSearch = e.target.value.trim();
  currentUserPage = 1;
  loadUsers(currentUserPage, currentSearch);
});

window.addEventListener('DOMContentLoaded', async () => {
  await verifyAdmin();
  await loadEvents();
  await loadRegistrations();
  await loadUsers();
});