const axios = require('axios');
const Lead = require('../models/Lead');
const Settings = require('../models/Settings');
const Service = require('../models/Service');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');
const geminiService = require('./geminiService');
const sseService = require('./sseService');
const { decrypt } = require('../config/crypto');

const INDIAMART_API_URL = 'https://mapi.indiamart.com/wservices/enquiry/search/summary/';

function parseIndiaMartDate(dateStr) {
  if (!dateStr) return new Date();
  const normalized = dateStr.replace(/\s+/g, ' ').trim();
  const d = new Date(normalized);
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

function normalizeLead(rawLead, userId) {
  const queryId = rawLead.QUERY_ID || rawLead.query_id || rawLead.UNIQUE_QUERY_ID;
  const productName = rawLead.QUERY_PRODUCT_NAME || rawLead.PRODUCT_NAME || rawLead.product_name || 'General Inquiry';
  const queryMessage = rawLead.QUERY_MESSAGE || rawLead.ENQ_MESSAGE || rawLead.message || '';
  const senderName = rawLead.SENDER_NAME || rawLead.sender_name || 'Valued Prospect';
  const senderEmail = rawLead.SENDER_EMAIL || rawLead.sender_email || '';
  const senderMobile = rawLead.SENDER_MOBILE || rawLead.sender_mobile || rawLead.SENDER_PHONE || '';
  const senderCompany = rawLead.SENDER_COMPANY || rawLead.sender_company || '';
  const senderCity = rawLead.SENDER_CITY || rawLead.sender_city || '';
  const senderState = rawLead.SENDER_STATE || rawLead.sender_state || '';
  const queryTime = parseIndiaMartDate(rawLead.QUERY_TIME || rawLead.DATE_TIME_RE);

  return {
    user: userId,
    uniqueQueryId: String(queryId),
    queryTime,
    queryType: rawLead.QUERY_TYPE || 'W',
    queryProductName: productName,
    queryMessage,
    subject: rawLead.SUBJECT || productName,
    senderName,
    senderMobile,
    senderEmail,
    senderCompany,
    senderAddress: rawLead.SENDER_ADDRESS || '',
    senderCity,
    senderState,
    senderCountryISO: rawLead.SENDER_COUNTRY_ISO || 'IN',
    raw: rawLead,
  };
}

async function findMatchingService(userId, lead) {
  const services = await Service.find({ user: userId });
  if (!services || services.length === 0) return null;

  const targetText = `${lead.queryProductName || ''} ${lead.productName || ''} ${lead.queryMessage || ''} ${lead.subject || ''}`.toLowerCase();

  // Strict keyword & service name matching
  for (const service of services) {
    if (service.name && service.name.trim() && targetText.includes(service.name.toLowerCase().trim())) {
      return service;
    }
    if (service.keywords && Array.isArray(service.keywords) && service.keywords.length > 0) {
      for (const kw of service.keywords) {
        if (kw && kw.trim() && targetText.includes(kw.toLowerCase().trim())) {
          return service;
        }
      }
    }
  }

  // Strictly return null if no keyword matched (do not fallback to sending random proposals)
  return null;
}

async function processNewLead(userId, settings, leadDoc) {
  let lead = await Lead.findOneAndUpdate(
    { user: userId, uniqueQueryId: leadDoc.uniqueQueryId },
    { $setOnInsert: leadDoc },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  sseService.broadcast(String(userId), { type: 'new_lead', lead });

  // Automatic AI lead scoring first
  try {
    const { score, summary } = await geminiService.scoreLead({
      geminiApiKey: settings.gemini?.apiKey,
      lead,
    });
    lead.aiScore = score;
    lead.aiSummary = summary;
    lead.aiScoredAt = new Date();
    await lead.save();
    sseService.broadcast(String(userId), { type: 'lead_scored', leadId: lead._id, score, summary });
  } catch (err) {
    console.error(`[ai_scoring] Error scoring lead ${lead._id}:`, err.message);
  }

  // Find matching service for this lead
  const matchedService = await findMatchingService(userId, lead);

  // If NO matching service was added for this lead's requirement, ONLY fetch & save lead without sending auto-proposals!
  if (!matchedService) {
    console.log(
      `[lead_sync] Lead ${lead._id} ("${lead.queryProductName}") saved to dashboard. No matching service keyword added by user, skipping auto-outreach.`
    );
    return lead;
  }

  // Determine email templates & attachments from matched service
  const emailTemplates = {
    emailSubject: matchedService.emailSubject || settings.templates?.emailSubject,
    emailBody: matchedService.emailBody || settings.templates?.emailBody,
  };
  const emailAttachment = matchedService.emailAttachment;

  // Determine WhatsApp templates & attachments from matched service
  const whatsappTemplates = {
    whatsappGreeting: matchedService.whatsappMessage || settings.templates?.whatsappGreeting,
  };
  const whatsappAttachment = matchedService.whatsappAttachment;

  // Auto email
  if (settings.automation.autoEmailEnabled && settings.smtp.host && lead.senderEmail) {
    try {
      await emailService.sendProposalEmail({
        smtpSettings: settings.smtp,
        templates: emailTemplates,
        lead,
        attachment: emailAttachment,
      });
      lead.emailSent = true;
      lead.emailSentAt = new Date();
      await lead.save();
      sseService.broadcast(String(userId), { type: 'email_sent', leadId: lead._id });
    } catch (err) {
      sseService.broadcast(String(userId), { type: 'error', context: 'email', message: err.message });
    }
  }

  // Auto WhatsApp
  if (settings.automation.autoWhatsappEnabled && settings.whatsapp.sessionActive && lead.senderMobile) {
    try {
      await whatsappService.sendGreeting({
        userId: String(userId),
        templates: whatsappTemplates,
        lead,
        attachment: whatsappAttachment,
      });
      lead.whatsappSent = true;
      lead.whatsappSentAt = new Date();
      await lead.save();
      sseService.broadcast(String(userId), { type: 'whatsapp_sent', leadId: lead._id });
    } catch (err) {
      sseService.broadcast(String(userId), { type: 'error', context: 'whatsapp', message: err.message });
    }
  }

  return lead;
}

async function syncUserLeads(userId) {
  const settings = await Settings.findOne({ user: userId });
  if (!settings || !settings.indiamart.apiKey) {
    throw new Error('IndiaMART API key is not configured yet. Add it in Settings first.');
  }

  const apiKey = decrypt(settings.indiamart.apiKey);
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // last 7 days

  const formatDate = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${pad(d.getDate())}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  const response = await axios.get(INDIAMART_API_URL, {
    params: {
      GLUSB_CRM_KEY: apiKey,
      start_time: formatDate(startDate),
      end_time: formatDate(endDate),
    },
    timeout: 15000,
  });

  const body = response.data;
  let rawList = [];

  if (body && (body.CODE === '404' || body.CODE === 404 || body.STATUS === 'FAILURE' || body.MESSAGE === 'Authentication Failed')) {
    throw new Error(`IndiaMART Authentication Failed: ${body.MESSAGE || 'Invalid or Expired API Key'}. Please check your CRM Key in IndiaMART Seller Panel.`);
  }

  if (Array.isArray(body)) {
    rawList = body;
  } else if (body && Array.isArray(body.RESPONSE)) {
    rawList = body.RESPONSE;
  } else if (body && body.CODE === 200 && Array.isArray(body.RESPONSE)) {
    rawList = body.RESPONSE;
  }

  let createdCount = 0;
  for (const raw of rawList) {
    const norm = normalizeLead(raw, userId);
    const existing = await Lead.findOne({ user: userId, uniqueQueryId: norm.uniqueQueryId });
    if (!existing) {
      await processNewLead(userId, settings, norm);
      createdCount++;
    }
  }

  settings.indiamart.lastSyncAt = new Date();
  settings.indiamart.connected = true;
  await settings.save();

  return { created: createdCount, totalPulled: rawList.length };
}

module.exports = {
  syncUserLeads,
  processNewLead,
  normalizeLead,
};
