const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const initAdmin = require('./config/adminInit');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const badgeRoutes = require('./routes/badgeRoutes');
const { initBadges } = require('./controllers/badgeController');

const app = express();

// Connect to Database and Initialize Admin
connectDB().then(() => {
    initAdmin();
    initBadges();
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/badges', badgeRoutes);

// Serve Frontend Static Files
const frontendPath = path.join(__dirname, './Frontend');
app.use(express.static(frontendPath));

// Catch-all route to serve the frontend index.html
app.use((req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server v1.1 running on port ${PORT}`);
});
