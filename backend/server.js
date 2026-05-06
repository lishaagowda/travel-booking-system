const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://lishaagowda.github.io', 'https://travel-booking-backend.onrender.com']
    : '*',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

const DB_PATH = path.join(__dirname, 'database');

// Helper to read/write JSON files
const loadData = (file, defaultData = []) => {
  const filePath = path.join(DB_PATH, `${file}.json`);
  if (!fs.existsSync(filePath)) {
    if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return defaultData;
  }
};

const saveData = (file, data) => {
  const filePath = path.join(DB_PATH, `${file}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Initialize data stores
let users = loadData('users');
let bookings = loadData('bookings', [
  { id: 1, user: 'test@example.com', destination: 'Paris to London (Train)', date: '2026-04-23', status: 'Confirmed' },
  { id: 2, user: 'admin@example.com', destination: 'Tokyo to Kyoto (Train)', date: '2026-04-24', status: 'Pending' }
]);
let groupTrips = loadData('groups');

// Auth Endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'User already exists' });
  users.push({ email, password, name, role: email === 'admin@admin.com' ? 'admin' : 'user' });
  saveData('users', users);
  res.status(201).json({ message: 'Registration successful' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@admin.com' && password === 'Admin@123') {
    return res.json({ message: 'Login successful', user: { email, name: 'Admin User', role: 'admin' } });
  }
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ message: 'Login successful', user: { email: user.email, name: user.name, role: user.role } });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Booking Endpoints
app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  const { user, destination, date } = req.body;
  const newBooking = { id: Date.now(), user, destination, date, status: 'Pending' };
  bookings.push(newBooking);
  saveData('bookings', bookings);
  res.status(201).json({ message: 'Booking confirmed!', booking: newBooking });
});

app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const index = bookings.findIndex(b => b.id === parseInt(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  bookings.splice(index, 1);
  saveData('bookings', bookings);
  res.json({ message: 'Booking cancelled successfully' });
});

app.put('/api/bookings/:id/confirm', (req, res) => {
  const { id } = req.params;
  const booking = bookings.find(b => b.id === parseInt(id));
  if (booking) {
    booking.status = 'Confirmed';
    saveData('bookings', bookings);
    res.json(booking);
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});

// Group Endpoints
app.post('/api/groups', (req, res) => {
  const newGroup = {
    id: `group-${Date.now()}`,
    name: req.body.name,
    creator: req.body.creator,
    members: [req.body.creator],
    votes: {},
    expenses: []
  };
  groupTrips.push(newGroup);
  saveData('groups', groupTrips);
  res.status(201).json(newGroup);
});

app.get('/api/groups', (req, res) => {
  const { user } = req.query;
  const userGroups = groupTrips.filter(g => g.members.includes(user));
  res.json(userGroups);
});

app.get('/api/groups/:id', (req, res) => {
  const group = groupTrips.find(g => g.id === req.params.id);
  if (group) res.json(group);
  else res.status(404).json({ error: 'Group not found' });
});

app.post('/api/groups/:id/join', (req, res) => {
  const group = groupTrips.find(g => g.id === req.params.id);
  if (group && !group.members.includes(req.body.user)) {
    group.members.push(req.body.user);
    saveData('groups', groupTrips);
  }
  res.json(group);
});

app.post('/api/groups/:id/vote', (req, res) => {
  const group = groupTrips.find(g => g.id === req.params.id);
  const { category, option, user } = req.body;
  
  if (!group.votes[category]) group.votes[category] = {};
  if (!group.votes[category][option]) group.votes[category][option] = [];
  
  // One vote per user per category
  Object.keys(group.votes[category]).forEach(opt => {
    group.votes[category][opt] = group.votes[category][opt].filter(u => u !== user);
  });
  
  group.votes[category][option].push(user);
  saveData('groups', groupTrips);
  res.json(group);
});

app.post('/api/groups/:id/expenses', (req, res) => {
  const group = groupTrips.find(g => g.id === req.params.id);
  const { description, amount, paidBy } = req.body;
  group.expenses.push({ id: Date.now(), description, amount: parseFloat(amount), paidBy });
  saveData('groups', groupTrips);
  res.json(group);
});

// Admin Stats
app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalUsers: users.length + 1, // +1 for the hardcoded admin
    totalBookings: bookings.length,
    revenue: bookings.length * 500,
    users: users
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
