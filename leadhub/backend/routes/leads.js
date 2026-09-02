const express = require('express');
const Lead = require('../models/Lead');
const Settings = require('../models/Settings');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const geminiService = require('../services/geminiService');
const indiamartService = require('../services/indiamartService');
const { broadcast } = require('../services/sseService');

const router = express.Router();

const SAMPLE_LEADS = [
  {
    senderName: 'Saba Mallick',
    senderCompany: 'Mallick Packaging Co.',
    senderMobile: '+91-551209787',
    senderEmail: '',
    senderCity: 'India',
    senderState: '',
    productName: 'Box Packaging Design Services',
    queryMessage: 'Requirement for Box Packaging Design Services. Need custom dimensions & branding.',
    queryType: 'BL',
    status: 'New',
    aiScore: 85,
    aiSummary: 'High intent buyer looking for custom box packaging design & printing.',
    operator: 'Unknown Operator',
    emailValid: false,
    phoneFormat: 'Format Only',
    queryTime: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    senderName: 'Ranu',
    senderCompany: 'Ranu Tech Solutions',
    senderMobile: '+91-8262990051',
    senderEmail: 'meshramrakhita23@gmail.com',
    senderCity: 'Ghatanji',
    senderState: 'Maharashtra',
    productName: 'Form Filling Service',
    queryMessage: 'Requirement for Form Filling Service. High volume daily data entry needed.',
    queryType: 'BL',
    status: 'Contacted',
    whatsappSent: true,
    aiScore: 78,
    aiSummary: 'Verified buy lead for data entry/form filling automation.',
    operator: 'Unknown Operator',
    emailValid: true,
    phoneFormat: 'Format Only',
    queryTime: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    senderName: 'Munish',
    senderCompany: 'Chandan Enterprises',
    senderMobile: '+91-9797654321',
    senderEmail: 'munishchandan@gmail.com',
    senderCity: 'Chandigarh',
    senderState: 'Chandigarh',
    productName: 'Advertising Brochure',
    queryMessage: 'Same packaging items in festival season - Requirement for Advertising Brochure',
    queryType: 'BL',
    status: 'Contacted',
    whatsappSent: true,
    aiScore: 72,
    aiSummary: 'Festival promotional brochure requirement for retail packaging items.',
    operator: 'Unknown Operator',
    emailValid: true,
    phoneFormat: 'Format Only',
    queryTime: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    senderName: 'SHIVA',
    senderCompany: 'Shiva Graphics',
    senderMobile: '+91-9850754321',
    senderEmail: '',
    senderCity: 'New Delhi',
    senderState: 'Delhi',
    productName: 'Visiting Cards',
    queryMessage: 'Requirement for Visiting Cards Card Printing. Quantity 5000 pcs.',
    queryType: 'W',
    status: 'New',
    aiScore: 55,
    aiSummary: 'Direct enquiry for premium visiting card printing.',
    operator: 'Unknown Operator',
    emailValid: false,
    phoneFormat: 'Format Only',
    queryTime: new Date(Date.now() - 1000 * 60 * 180),
  },
  {
    senderName: 'PRAKASH',
    senderCompany: 'Prakash Traders',
    senderMobile: '+91-9964450458',
    senderEmail: 'prakashdanoli13@gmail.com',
    senderCity: 'Honnali',
    senderState: 'Karnataka',
    productName: 'Email Marketing Services',
    queryMessage: 'Buyer Searched for Email. Probable Requirement Type: Fixed monthly plan',
    queryType: 'BL',
    status: 'Contacted',
    whatsappSent: true,
    aiScore: 82,
    aiSummary: 'High priority enquiry for bulk email marketing automation campaign.',
    operator: 'Unknown Operator',
    emailValid: true,
    phoneFormat: 'Format Only',
    queryTime: new Date(Date.now() - 1000 * 60 * 240),
  },
  {
    senderName: 'Pedro Philippi Kreusch',
    senderCompany: 'BP Products',
    senderMobile: '+91-9811223344',
    senderEmail: 'bpproducts-pedro.philippi.kreusch@gmail.com',
    senderCity: '',
    senderState: '',
    productName: 'Round Neck T Shirts',
    queryMessage: 'Requirement for Round Neck T Shirts bulk corporate order.',
    queryType: 'W',
    status: 'Contacted',
    emailSent: true,
    aiScore: 45,
    aiSummary: 'Direct enquiry for customized corporate apparel.',
    operator: 'Unknown Operator',
    emailValid: true,
    phoneFormat: 'Format Only',
    queryTime: new Date(Date.now() - 1000 * 60 * 360),
  },
  {
    senderName: 'Pardeep Singh Virk',
    senderCompany: 'Virk Enterprises',
    senderMobile: '+91-9876543210',
    senderEmail: 'virkpardeep94@gmail.com',
    senderCity: 'Ludhiana',
    senderState: 'Punjab',
    productName: 'Corporate Logo Design',
    queryMessage: 'Requirement for Corporate Logo Design & complete brand identity suite.',
    queryType: 'BL',
    status: 'Converted',
    emailSent: true,
    whatsappSent: true,
    aiScore: 90,
    aiSummary: 'Converted client for complete branding & catalogue design package.',
    operator: 'Unknown Operator',
    emailValid: true,
    phoneFormat: 'Format Only',
    queryTime: new Date(Date.now() - 1000 * 60 * 500),
  },
];

// DELETE /api/leads/clear-all (Clear all leads for current user)
router.delete('/clear-all', async (req, res) => {
  try {
    const result = await Lead.deleteMany({ user: req.userId });
    res.json({ message: `Cleared ${result.deletedCount} leads.` });
  } catch (err) {
    res.status(500).json({ message: 'Could not clear leads.' });
  }
});

// GET /api/leads
router.get('/', async (req, res) => {
  try {
    const { status, queryType, search, from, to } = req.query;
    const filter = { user: req.userId };

    if (status && status !== 'All') {
      if (status === 'Hot') filter.aiScore = { $gte: 70 };
      else if (status === 'Warm') filter.aiScore = { $gte: 40, $lt: 70 };
      else if (status === 'Cold') filter.aiScore = { $lt: 40 };
      else filter.status = status;
    }
    if (queryType) {
      if (queryType === 'BL' || queryType === 'B') {
        filter.queryType = { $in: ['BL', 'B', 'P', 'BIZ'] };
      } else {
        filter.queryType = queryType;
      }
    }
    if (from || to) {
      filter.queryTime = {};
      if (from) filter.queryTime.$gte = new Date(from);
      if (to) filter.queryTime.$lte = new Date(to);
    }
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [
        { senderName: re },
        { senderCompany: re },
        { productName: re },
        { senderCity: re },
        { queryMessage: re },
        { senderEmail: re },
        { senderMobile: re },
      ];
    }

    const leads = await Lead.find(filter).sort({ queryTime: -1 }).limit(500);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch leads.', error: err.message });
  }
});

// GET /api/leads/inbox (Email & WhatsApp sent activity logs)
router.get('/inbox', async (req, res) => {
  try {
    const leads = await Lead.find({
      user: req.userId,
      $or: [{ emailSent: true }, { whatsappSent: true }],
    }).sort({ updatedAt: -1 });

    const logs = [];
    leads.forEach((l) => {
      if (l.whatsappSent) {
        logs.push({
          id: `${l._id}-wa`,
          leadId: l._id,
          channel: 'whatsapp',
          recipient: `${l.senderName || 'Client'} (${l.senderCompany || 'IndiaMART'}) <${l.senderMobile || '+91-9876543210'} (WhatsApp)>`,
          title: `WhatsApp Auto: ${l.productName || 'service'} template`,
          body: `Hi ${l.senderName || 'there'},\n\nThank you for reaching out regarding ${l.productName || 'your requirement'} on IndiaMART.\n\nKindly share more details about your requirements so we can send the right quote.`,
          sentAt: l.whatsappSentAt || l.updatedAt,
          status: 'SENT',
        });
      }
      if (l.emailSent) {
        logs.push({
          id: `${l._id}-email`,
          leadId: l._id,
          channel: 'email',
          recipient: `${l.senderName || 'Client'} <${l.senderEmail || 'client@example.com'}>`,
          title: `Proposal for ODD INFOTECH ${l.productName || 'Services'}`,
          body: `Dear ${l.senderName || 'Client'},\n\nGood day!\n\nThank you for reaching out to Odd Infotech. Please find attached our proposal & portfolio presentation.`,
          sentAt: l.emailSentAt || l.updatedAt,
          status: 'SENT',
        });
      }
    });

    logs.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch inbox logs.' });
  }
});

// GET /api/leads/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;
    const [total, hot, warm, clients, replied, byStatus, byType] = await Promise.all([
      Lead.countDocuments({ user: userId }),
      Lead.countDocuments({ user: userId, $or: [{ aiScore: { $gte: 70 } }, { queryType: 'BL' }] }),
      Lead.countDocuments({ user: userId, aiScore: { $gte: 40, $lt: 70 } }),
      Lead.countDocuments({ user: userId, status: 'Converted' }),
      Lead.countDocuments({ user: userId, $or: [{ emailSent: true }, { whatsappSent: true }] }),
      Lead.aggregate([{ $match: { user: userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lead.aggregate([{ $match: { user: userId } }, { $group: { _id: '$queryType', count: { $sum: 1 } } }]),
    ]);
    res.json({ total, hot, warm, clients, replied, byStatus, byType });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch stats.', error: err.message });
  }
});

// POST /api/leads (Manual lead creation)
router.post('/', async (req, res) => {
  try {
    const { senderName, senderCompany, senderMobile, senderEmail, senderCity, productName, queryMessage, queryType } = req.body;
    if (!senderName && !senderMobile) {
      return res.status(400).json({ message: 'Lead Name or Mobile is required.' });
    }

    const lead = await Lead.create({
      user: req.userId,
      uniqueQueryId: `manual-${Date.now()}-${Math.random()}`,
      senderName: senderName || 'Manual Contact',
      senderCompany: senderCompany || '',
      senderMobile: senderMobile || '',
      senderEmail: senderEmail || '',
      senderCity: senderCity || '',
      productName: productName || 'General Requirement',
      queryMessage: queryMessage || '',
      queryType: queryType === 'BL' ? 'BL' : 'W',
      queryTime: new Date(),
      status: 'New',
      source: 'Manual Add',
    });

    // Score lead automatically
    try {
      const settings = await Settings.findOne({ user: req.userId });
      const { score, summary } = await geminiService.scoreLead({ geminiApiKey: settings?.gemini?.apiKey, lead });
      lead.aiScore = score;
      lead.aiSummary = summary;
      await lead.save();
    } catch (e) {}

    broadcast(String(req.userId), { type: 'new_lead', lead });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: 'Could not add lead.', error: err.message });
  }
});

// POST /api/leads/import (Bulk CSV/Excel lead import)
router.post('/import', async (req, res) => {
  try {
    const { leads: leadArray } = req.body;
    if (!Array.isArray(leadArray) || leadArray.length === 0) {
      return res.status(400).json({ message: 'No leads provided for import.' });
    }

    const docs = leadArray.map((l) => ({
      user: req.userId,
      uniqueQueryId: `import-${Date.now()}-${Math.random()}`,
      senderName: l.senderName || l.Name || 'Imported Lead',
      senderCompany: l.senderCompany || l.Company || '',
      senderMobile: l.senderMobile || l.Mobile || l.Phone || '',
      senderEmail: l.senderEmail || l.Email || '',
      senderCity: l.senderCity || l.City || '',
      productName: l.productName || l.Product || 'Service Requirement',
      queryMessage: l.queryMessage || l.Message || '',
      queryType: l.queryType === 'BL' || l.Type === 'BL' ? 'BL' : 'W',
      queryTime: new Date(),
      status: 'New',
      source: 'Excel Import',
    }));

    const created = await Lead.insertMany(docs);
    res.json({ message: `Successfully imported ${created.length} leads.`, count: created.length });
  } catch (err) {
    res.status(500).json({ message: 'Import failed.', error: err.message });
  }
});

// PATCH /api/leads/:id/star
router.patch('/:id/star', async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, user: req.userId });
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });
    lead.starred = !lead.starred;
    await lead.save();
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: 'Could not toggle star.' });
  }
});

// PATCH /api/leads/:id/status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: { status } },
    { new: true }
  );
  if (!lead) return res.status(404).json({ message: 'Lead not found.' });
  res.json(lead);
});

// PATCH /api/leads/:id/notes
router.patch('/:id/notes', async (req, res) => {
  const { notes } = req.body;
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { $set: { notes } },
    { new: true }
  );
  if (!lead) return res.status(404).json({ message: 'Lead not found.' });
  res.json(lead);
});

// DELETE /api/leads/:id
router.delete('/:id', async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });
    res.json({ message: 'Lead deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete lead.' });
  }
});

// Manual "send now" actions
router.post('/:id/send-email', async (req, res) => {
  try {
    const [lead, settings] = await Promise.all([
      Lead.findOne({ _id: req.params.id, user: req.userId }),
      Settings.findOne({ user: req.userId }),
    ]);
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });

    await emailService.sendProposalEmail({ smtpSettings: settings.smtp, templates: settings.templates, lead });
    lead.emailSent = true;
    lead.emailSentAt = new Date();
    await lead.save();
    broadcast(String(req.userId), { type: 'email_sent', leadId: lead._id });
    res.json(lead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:id/send-whatsapp', async (req, res) => {
  try {
    const [lead, settings] = await Promise.all([
      Lead.findOne({ _id: req.params.id, user: req.userId }),
      Settings.findOne({ user: req.userId }),
    ]);
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });

    await whatsappService.sendGreeting({ userId: String(req.userId), templates: settings.templates, lead });
    lead.whatsappSent = true;
    lead.whatsappSentAt = new Date();
    await lead.save();
    broadcast(String(req.userId), { type: 'whatsapp_sent', leadId: lead._id });
    res.json(lead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:id/score', async (req, res) => {
  try {
    const [lead, settings] = await Promise.all([
      Lead.findOne({ _id: req.params.id, user: req.userId }),
      Settings.findOne({ user: req.userId }),
    ]);
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });

    const { score, summary } = await geminiService.scoreLead({ geminiApiKey: settings.gemini?.apiKey, lead });
    lead.aiScore = score;
    lead.aiSummary = summary;
    lead.aiScoredAt = new Date();
    await lead.save();
    res.json(lead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const result = await indiamartService.syncUserLeads(req.userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
