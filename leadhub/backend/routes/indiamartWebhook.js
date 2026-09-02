const express = require('express');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { processNewLead, normalizeLead } = require('../services/indiamartService');
const { decrypt } = require('../config/crypto');

const router = express.Router();

// POST /api/indiamart/webhook (IndiaMART Push API - Real-time Lead Listener)
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const rawData = req.body;
    if (!rawData) {
      return res.status(400).json({ status: 'FAILURE', message: 'No payload received' });
    }

    // Identify user by key param or fallback to master admin
    const keyParam = req.query.key || req.query.GLUSB_CRM_KEY || req.body.GLUSB_CRM_KEY;
    let targetUser = null;
    let userSettings = null;

    if (keyParam) {
      const allSettings = await Settings.find({ 'indiamart.apiKey': { $ne: '' } });
      for (const s of allSettings) {
        let decKey = decrypt(s.indiamart.apiKey) || s.indiamart.apiKey;
        if (decKey && decKey.trim() === String(keyParam).trim()) {
          targetUser = s.user;
          userSettings = s;
          break;
        }
      }
    }

    if (!targetUser) {
      const admin = await User.findOne({ email: 'natasha@oddinfotech.com' }) || await User.findOne({ role: 'admin' });
      if (admin) {
        targetUser = admin._id;
        userSettings = await Settings.findOne({ user: targetUser });
      }
    }

    if (!targetUser || !userSettings) {
      return res.status(404).json({ status: 'FAILURE', message: 'User settings not found' });
    }

    const leadsArray = Array.isArray(rawData) ? rawData : (Array.isArray(rawData.RESPONSE) ? rawData.RESPONSE : [rawData]);
    let processedCount = 0;

    for (const item of leadsArray) {
      if (item && (item.QUERY_ID || item.query_id || item.UNIQUE_QUERY_ID || item.SENDER_MOBILE)) {
        const norm = normalizeLead(item, targetUser);
        await processNewLead(targetUser, userSettings, norm);
        processedCount++;
      }
    }

    return res.json({ STATUS: 'SUCCESS', message: `${processedCount} lead(s) processed in real-time` });
  } catch (err) {
    console.error('[indiamart_webhook] Error processing push lead:', err.message);
    return res.status(500).json({ STATUS: 'FAILURE', error: err.message });
  }
});

module.exports = router;
