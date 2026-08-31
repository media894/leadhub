const express = require('express');
const Settings = require('../models/Settings');
const { encrypt, decrypt } = require('../config/crypto');
const emailService = require('../services/emailService');

const router = express.Router();

// Mask a secret for safe display in the UI if needed
function mask(value) {
  if (!value) return '';
  if (value.length <= 6) return '•'.repeat(value.length);
  return `${value.slice(0, 4)}${'•'.repeat(Math.max(3, value.length - 8))}${value.slice(-4)}`;
}

async function getOrCreateSettings(userId) {
  let settings = await Settings.findOne({ user: userId });
  if (!settings) {
    settings = await Settings.create({ user: userId });
  }
  return settings;
}

router.get('/', async (req, res) => {
  const settings = await getOrCreateSettings(req.userId);
  const s = settings.toObject();

  let smtpPass = '';
  if (s.smtp && s.smtp.pass) {
    try {
      smtpPass = decrypt(s.smtp.pass);
    } catch (e) {
      smtpPass = s.smtp.pass;
    }
  }

  let imapPass = '';
  if (s.imap && s.imap.pass) {
    try {
      imapPass = decrypt(s.imap.pass);
    } catch (e) {
      imapPass = s.imap.pass;
    }
  }

  let imKey = '';
  if (s.indiamart && s.indiamart.apiKey) {
    try {
      imKey = decrypt(s.indiamart.apiKey);
    } catch (e) {
      imKey = s.indiamart.apiKey;
    }
  }

  const isIndiamartConnected = !!(s.indiamart && s.indiamart.apiKey);
  const isSmtpConnected = !!(s.smtp && s.smtp.host && s.smtp.user && s.smtp.pass);

  res.json({
    indiamart: {
      ...s.indiamart,
      apiKey: imKey,
      apiKeySet: isIndiamartConnected,
      connected: isIndiamartConnected,
    },
    smtp: {
      ...s.smtp,
      pass: smtpPass,
      passSet: !!s.smtp?.pass,
      connected: isSmtpConnected,
    },
    imap: { ...s.imap, pass: imapPass, passSet: !!s.imap?.pass },
    whatsapp: s.whatsapp,
    gemini: {
      ...s.gemini,
      apiKey: s.gemini?.apiKey ? mask(decrypt(s.gemini.apiKey)) : (process.env.GEMINI_API_KEY ? mask(process.env.GEMINI_API_KEY) : ''),
      apiKeySet: !!(s.gemini?.apiKey || process.env.GEMINI_API_KEY),
      isSystemKey: !s.gemini?.apiKey && !!process.env.GEMINI_API_KEY,
    },
    templates: s.templates,
    automation: s.automation,
  });
});

router.get('/status', async (req, res) => {
  const Service = require('../models/Service');
  const settings = await getOrCreateSettings(req.userId);

  const serviceCount = await Service.countDocuments({ user: req.userId });

  const indiamartConfigured = !!settings.indiamart?.apiKey;
  const smtpConfigured = !!(settings.smtp?.host && settings.smtp?.user && settings.smtp?.pass);
  const whatsappConfigured = !!settings.whatsapp?.sessionActive;
  const serviceConfigured = serviceCount > 0;

  const isCompleted = indiamartConfigured && smtpConfigured && serviceConfigured;

  res.json({
    isCompleted,
    details: {
      indiamart: indiamartConfigured,
      indiamartConfigured,
      smtp: smtpConfigured,
      smtpConfigured,
      whatsapp: whatsappConfigured,
      whatsappConfigured,
      services: serviceConfigured,
      serviceConfigured,
    },
  });
});

// PUT /api/settings/indiamart
router.put('/indiamart', async (req, res) => {
  try {
    const { apiKey, autoSyncEnabled, syncIntervalMinutes } = req.body;
    const settings = await getOrCreateSettings(req.userId);

    if (apiKey !== undefined && apiKey !== '') {
      settings.indiamart.apiKey = encrypt(apiKey);
      settings.indiamart.connected = true;
    }
    if (typeof autoSyncEnabled === 'boolean') {
      settings.indiamart.autoSyncEnabled = autoSyncEnabled;
    }
    if (syncIntervalMinutes) {
      settings.indiamart.syncIntervalMinutes = syncIntervalMinutes;
    }

    await settings.save();
    res.json({ message: 'IndiaMART settings updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update settings.', error: err.message });
  }
});

// POST /api/settings/indiamart/disconnect
router.post('/indiamart/disconnect', async (req, res) => {
  try {
    const settings = await getOrCreateSettings(req.userId);

    settings.indiamart.apiKey = '';
    settings.indiamart.connected = false;
    await settings.save();

    res.json({ message: 'IndiaMART disconnected successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not disconnect IndiaMART.' });
  }
});

// PUT /api/settings/smtp
router.put('/smtp', async (req, res) => {
  try {
    const { host, port, secure, user, pass, fromName } = req.body;
    const settings = await getOrCreateSettings(req.userId);

    if (host !== undefined) settings.smtp.host = host;
    if (port !== undefined) settings.smtp.port = port;
    if (secure !== undefined) settings.smtp.secure = secure;
    if (user !== undefined) settings.smtp.user = user;
    if (pass !== undefined && pass !== '') {
      settings.smtp.pass = encrypt(pass);
    }
    if (fromName !== undefined) settings.smtp.fromName = fromName;
    settings.smtp.connected = !!(settings.smtp.host && settings.smtp.user && settings.smtp.pass);

    await settings.save();
    res.json({ message: 'SMTP settings updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update SMTP settings.', error: err.message });
  }
});

// POST /api/settings/smtp/disconnect
router.post('/smtp/disconnect', async (req, res) => {
  try {
    const settings = await getOrCreateSettings(req.userId);

    settings.smtp.host = '';
    settings.smtp.user = '';
    settings.smtp.pass = '';
    settings.smtp.connected = false;
    await settings.save();

    res.json({ message: 'Email SMTP disconnected successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not disconnect SMTP.' });
  }
});

// POST /api/settings/smtp/test
router.post('/smtp/test', async (req, res) => {
  try {
    const settings = await getOrCreateSettings(req.userId);
    if (!settings.smtp.host) {
      return res.status(400).json({ message: 'SMTP settings are not configured.' });
    }

    await emailService.verifySmtp(settings.smtp);
    settings.smtp.connected = true;
    await settings.save();

    res.json({ message: 'SMTP connection verified successfully!' });
  } catch (err) {
    if (settings) {
      settings.smtp.connected = false;
      await settings.save();
    }
    res.status(400).json({ message: `SMTP verification failed: ${err.message}` });
  }
});

// PUT /api/settings/gemini
router.put('/gemini', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const settings = await getOrCreateSettings(req.userId);

    if (apiKey) {
      settings.gemini.apiKey = encrypt(apiKey);
      settings.gemini.connected = true;
    }

    await settings.save();
    res.json({ message: 'Gemini AI API key saved.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update Gemini key.', error: err.message });
  }
});

// PUT /api/settings/templates
router.put('/templates', async (req, res) => {
  try {
    const { emailSubject, emailBody, whatsappGreeting } = req.body;
    const settings = await getOrCreateSettings(req.userId);

    if (emailSubject !== undefined) settings.templates.emailSubject = emailSubject;
    if (emailBody !== undefined) settings.templates.emailBody = emailBody;
    if (whatsappGreeting !== undefined) settings.templates.whatsappGreeting = whatsappGreeting;

    await settings.save();
    res.json({ message: 'Templates updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update templates.', error: err.message });
  }
});

module.exports = router;
