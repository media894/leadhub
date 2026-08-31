const express = require('express');
const Settings = require('../models/Settings');
const whatsappService = require('../services/whatsappService');

const router = express.Router();

router.post('/connect', async (req, res) => {
  whatsappService.startSession(String(req.userId));
  res.json({ message: 'WhatsApp session starting. Scan the QR code that appears shortly.' });
});

router.get('/qr', async (req, res) => {
  const qr = whatsappService.getLatestQr(String(req.userId));
  res.json({ qr });
});

router.get('/status', async (req, res) => {
  const settings = await Settings.findOne({ user: req.userId });
  res.json(settings.whatsapp);
});

router.post('/disconnect', async (req, res) => {
  await whatsappService.stopSession(String(req.userId));
  res.json({ message: 'WhatsApp disconnected.' });
});

module.exports = router;
