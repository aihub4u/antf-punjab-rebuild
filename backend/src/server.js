require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const closeStatusRoutes = require('./routes/closeStatus');
const viewRequestRoutes = require('./routes/viewRequest');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const employeesRoutes = require('./routes/employees');
const mobileListenerRoutes = require('./routes/mobileListener');
const notificationsRoutes = require('./routes/notifications');
const runMigrationRoutes = require('./routes/runMigration');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // legacy callers post form-encoded, not JSON

app.use('/api/auth', authRoutes);
app.use('/api/close-status', closeStatusRoutes);
app.use('/api/view-request', viewRequestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

// Mounted at their exact legacy .aspx paths (NOT under /api) so external
// callers - the mobile app and Karix's WhatsApp integration - keep working
// with zero reconfiguration on their end. See notifications.js for the
// important note on why B2BWebService's URL in particular can't move.
app.use('/MobileListener.aspx', mobileListenerRoutes);
app.use('/', notificationsRoutes);
app.use('/', runMigrationRoutes);

// More routers get mounted here as each page is rebuilt.

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
