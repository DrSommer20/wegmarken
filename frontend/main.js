import './style.css';
import L from 'leaflet';

// State
let token = localStorage.getItem('jwt_token') || null;
let currentTripId = null;
let trips = [];
let map = null;
let stops = [];
let markers = [];
let currentStopId = null;

const API_BASE = 'http://localhost:8080/api';

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const mapScreen = document.getElementById('map-screen');

function showScreen(screen) {
  authScreen.classList.add('hidden');
  dashboardScreen.classList.add('hidden');
  mapScreen.classList.add('hidden');
  screen.classList.remove('hidden');
}

// Check auth on load
function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const tripParam = urlParams.get('trip');

  if (!token) {
    showScreen(authScreen);
  } else {
    if (tripParam) {
      currentTripId = parseInt(tripParam, 10);
      loadTripAndShowMap();
    } else {
      loadDashboard();
    }
  }
}

// ---------------- AUTH LOGIC ----------------
document.getElementById('btn-login').addEventListener('click', () => handleAuth('login'));
document.getElementById('btn-register').addEventListener('click', () => handleAuth('register'));
document.getElementById('btn-logout').addEventListener('click', () => {
  token = null;
  localStorage.removeItem('jwt_token');
  showScreen(authScreen);
});

async function handleAuth(action) {
  const user = document.getElementById('auth-user').value;
  const pass = document.getElementById('auth-pass').value;
  if(!user || !pass) return alert("Bitte alles ausfüllen");

  try {
    const res = await fetch(`${API_BASE}/auth/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    if (res.ok) {
      const data = await res.json();
      token = data.token;
      localStorage.setItem('jwt_token', token);
      
      const urlParams = new URLSearchParams(window.location.search);
      if(urlParams.get('trip')) {
        currentTripId = parseInt(urlParams.get('trip'), 10);
        loadTripAndShowMap();
      } else {
        loadDashboard();
      }
    } else {
      alert("Fehler bei der Anmeldung");
    }
  } catch (e) {
    console.error(e);
  }
}

function getAuthHeaders() {
  return { 'Authorization': `Bearer ${token}` };
}

// ---------------- DASHBOARD LOGIC ----------------
async function loadDashboard() {
  showScreen(dashboardScreen);
  try {
    const res = await fetch(`${API_BASE}/trips`, { headers: getAuthHeaders() });
    if (res.ok) {
      trips = await res.json();
      renderTripList();
    }
  } catch (e) { console.error(e); }
}

function renderTripList() {
  const grid = document.getElementById('trip-list');
  grid.innerHTML = '';
  if (trips.length === 0) {
    grid.innerHTML = '<p class="text-gray">Keine Reisen vorhanden.</p>';
    return;
  }
  trips.forEach(trip => {
    const el = document.createElement('div');
    el.className = 'trip-card';
    el.innerHTML = `<h3>${trip.name}</h3><p class="text-sm text-gray mt-2">${trip.description || ''}</p>`;
    el.addEventListener('click', () => {
      currentTripId = trip.id;
      window.history.pushState({}, '', `/?trip=${trip.id}`);
      loadTripAndShowMap();
    });
    grid.appendChild(el);
  });
}

document.getElementById('btn-new-trip').addEventListener('click', async () => {
  const name = prompt("Name der Reise:");
  if(!name) return;
  const desc = prompt("Beschreibung:");
  try {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ name, description: desc })
    });
    if(res.ok) loadDashboard();
  } catch (e) { console.error(e); }
});

// ---------------- MAP LOGIC ----------------
async function loadTripAndShowMap() {
  showScreen(mapScreen);
  if (!map) initMap();
  
  try {
    const res = await fetch(`${API_BASE}/trips/${currentTripId}`, { headers: getAuthHeaders() });
    if (res.ok) {
      const trip = await res.json();
      document.getElementById('trip-title').innerText = trip.name;
      document.getElementById('trip-desc').innerText = trip.description;
      stops = trip.stops || [];
      renderStops();
      drawStopsOnMap();
    } else {
      alert("Reise nicht gefunden oder keine Berechtigung");
      loadDashboard();
    }
  } catch (e) { console.error(e); }
}

function initMap() {
  map = L.map('map', { zoomControl: false }).setView([51.1657, 10.4515], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
}

function renderStops() {
  const list = document.getElementById('stop-list');
  list.innerHTML = '';
  stops.forEach(stop => {
    const li = document.createElement('li');
    li.className = 'stop-item';
    li.innerHTML = `<h4>${stop.name}</h4><p>${stop.description || ''}</p>`;
    li.addEventListener('click', () => {
      if(stop.latitude && stop.longitude) map.flyTo([stop.latitude, stop.longitude], 12);
      currentStopId = stop.id;
    });
    list.appendChild(li);
  });
}

function drawStopsOnMap() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  const bounds = [];
  stops.forEach(stop => {
    if (stop.latitude && stop.longitude) {
      const marker = L.marker([stop.latitude, stop.longitude]).addTo(map).bindPopup(`<b>${stop.name}</b>`);
      markers.push(marker);
      bounds.push([stop.latitude, stop.longitude]);
    }
  });
  if (bounds.length > 0) map.fitBounds(bounds, { padding: [50, 50] });
}

document.getElementById('btn-back').addEventListener('click', () => {
  window.history.pushState({}, '', '/');
  loadDashboard();
});

// NFC Setup
document.getElementById('btn-nfc').addEventListener('click', () => {
  const url = `${window.location.origin}/?trip=${currentTripId}`;
  document.getElementById('nfc-url').value = url;
  document.getElementById('nfc-modal').classList.remove('hidden');
});
document.getElementById('btn-close-nfc').addEventListener('click', () => {
  document.getElementById('nfc-modal').classList.add('hidden');
});

// Modals
document.getElementById('btn-add-stop').addEventListener('click', () => document.getElementById('stop-modal').classList.remove('hidden'));
document.getElementById('btn-close-modal').addEventListener('click', () => document.getElementById('stop-modal').classList.add('hidden'));

document.getElementById('btn-save-stop').addEventListener('click', async () => {
  const name = document.getElementById('stop-name').value;
  const desc = document.getElementById('stop-desc').value;
  if (!name) return;
  const center = map.getCenter();
  const newStop = { name, description: desc, latitude: center.lat, longitude: center.lng };

  try {
    const res = await fetch(`${API_BASE}/trips/${currentTripId}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(newStop)
    });
    if (res.ok) {
      stops.push(await res.json());
      renderStops(); drawStopsOnMap();
      document.getElementById('stop-modal').classList.add('hidden');
    }
  } catch(e) { console.error(e); }
});

// Image Upload
const imageUpload = document.getElementById('image-upload');
document.getElementById('btn-add-image').addEventListener('click', () => imageUpload.click());

imageUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData(); formData.append('file', file);
  
  const url = currentStopId 
    ? `${API_BASE}/trips/${currentTripId}/images?stopId=${currentStopId}`
    : `${API_BASE}/trips/${currentTripId}/images`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(), // Don't set content-type for FormData
      body: formData
    });
    if (res.ok) {
      const imgData = await res.json();
      if(imgData.latitude && imgData.longitude) {
        L.marker([imgData.latitude, imgData.longitude]).addTo(map)
          .bindPopup(`<img src="${imgData.url}" style="width:100px;"/><br>Foto`);
        map.flyTo([imgData.latitude, imgData.longitude], 14);
      } else {
        alert("Bild ohne GPS hochgeladen");
      }
    }
  } catch(e) { console.error(e); }
});

init();
