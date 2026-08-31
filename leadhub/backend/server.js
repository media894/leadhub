require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const auth = require('./middleware/auth');
const Settings = require('./models/Settings');
const indiamartService = require('./services/indiamartService');

const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const leadsRoutes = require('./routes/leads');
const whatsappRoutes = require('./routes/whatsapp');
const sseRoutes = require('./routes/sse');
const path = require('path');
const servicesRoutes = require('./routes/services');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'leadhub-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/sse', sseRoutes); // token via query param, no auth middleware
app.use('/api/settings', auth, settingsRoutes);
app.use('/api/leads', auth, leadsRoutes);
app.use('/api/whatsapp', auth, whatsappRoutes);
app.use('/api/services', auth, servicesRoutes);

// Global auto-sync: every minute, check which users have auto-sync ON and
// whose interval has elapsed, then pull their new IndiaMART leads.
cron.schedule('* * * * *', async () => {
  try {
    const dueUsers = await Settings.find({ 'indiamart.autoSyncEnabled': true, 'indiamart.apiKey': { $ne: '' } });
    const now = Date.now();
    for (const s of dueUsers) {
      const last = s.indiamart.lastSyncAt ? new Date(s.indiamart.lastSyncAt).getTime() : 0;
      const intervalMs = (s.indiamart.syncIntervalMinutes || 5) * 60 * 1000;
      if (now - last >= intervalMs) {
        indiamartService.syncUserLeads(s.user).catch((err) =>
          console.error(`[cron] sync failed for user ${s.user}:`, err.message)
        );
      }
    }
  } catch (err) {
    console.error('[cron] auto-sync loop error:', err.message);
  }
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] LeadHub backend running on port ${PORT}`));
});
