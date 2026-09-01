// Manages one whatsapp-web.js client per user (multi-tenant).
// Each user scans their OWN WhatsApp QR from the Settings panel -
// no shared numbers, no shared sessions.
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const Settings = require('../models/Settings');
const { broadcast } = require('./sseService');

const clients = new Map(); // userId -> Client instance
const latestQr = new Map(); // userId -> data URL

function fillTemplate(template, lead) {
  if (!template) return '';
  return template
    .replace(/{{\s*name\s*}}/gi, lead.senderName || 'there')
    .replace(/{{\s*product\s*}}/gi, lead.productName || lead.queryProductName || 'your requirement')
    .replace(/{{\s*company\s*}}/gi, lead.senderCompany || '');
}

function startSession(userId) {
  if (clients.has(userId)) return clients.get(userId);

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: `leadhub_${userId}` }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', async (qr) => {
    const dataUrl = await qrcode.toDataURL(qr);
    latestQr.set(userId, dataUrl);
    await Settings.updateOne({ user: userId }, { $set: { 'whatsapp.lastQrAt': new Date() } });
    broadcast(userId, { type: 'whatsapp_qr', qr: dataUrl });
  });

  client.on('ready', async () => {
    const number = client.info?.wid?.user || '';
    await Settings.updateOne(
      { user: userId },
      { $set: { 'whatsapp.sessionActive': true, 'whatsapp.connectedNumber': number } }
    );
    latestQr.delete(userId);
    broadcast(userId, { type: 'whatsapp_ready', number });
  });

  client.on('auth_failure', async (msg) => {
    console.error(`[whatsapp:${userId}] Auth failure:`, msg);
    latestQr.delete(userId);
    broadcast(userId, { type: 'whatsapp_disconnected' });
  });

  client.on('disconnected', async () => {
    await Settings.updateOne(
      { user: userId },
      { $set: { 'whatsapp.sessionActive': false, 'whatsapp.connectedNumber': '' } }
    );
    clients.delete(userId);
    latestQr.delete(userId);
    broadcast(userId, { type: 'whatsapp_disconnected' });
  });

  client.initialize().catch((err) => {
    console.error(`[whatsapp:${userId}] Initialization error:`, err.message);
  });
  clients.set(userId, client);
  return client;
}

function getLatestQr(userId) {
  return latestQr.get(userId) || null;
}

async function stopSession(userId) {
  const client = clients.get(userId);
  if (client) {
    await client.destroy().catch(() => {});
    clients.delete(userId);
  }
  latestQr.delete(userId);
  await Settings.updateOne(
    { user: userId },
    { $set: { 'whatsapp.sessionActive': false, 'whatsapp.connectedNumber': '' } }
  );
}

async function sendGreeting({ userId, templates, lead, attachment }) {
  const client = clients.get(userId);
  if (!client) {
    throw new Error('WhatsApp is not connected yet. Scan the QR code first.');
  }
  if (!lead.senderMobile) {
    throw new Error('This lead has no mobile number.');
  }

  const digits = String(lead.senderMobile).replace(/\D/g, '');
  const chatId = digits.length === 10 ? `91${digits}@c.us` : `${digits}@c.us`;
  
  const rawTemplate = templates?.whatsappGreeting || 'Hi {{name}} 👋, thanks for your enquiry about {{product}}!';
  const fullMessage = fillTemplate(rawTemplate, lead);

  // Split by 1 line space (double newline \n\s*\n) to send as sequential messages!
  const messageBlocks = fullMessage
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (attachment && attachment.path) {
    const fullPath = attachment.path.startsWith('/') || attachment.path.includes(':')
      ? path.join(__dirname, '..', attachment.path)
      : attachment.path;
    if (fs.existsSync(fullPath)) {
      const media = MessageMedia.fromFilePath(fullPath);
      const firstBlock = messageBlocks.shift() || '';
      await client.sendMessage(chatId, media, { caption: firstBlock });
      for (const block of messageBlocks) {
        await new Promise((res) => setTimeout(res, 800));
        await client.sendMessage(chatId, block);
      }
      return { message: fullMessage, attachmentSent: true };
    }
  }

  if (messageBlocks.length > 0) {
    for (let i = 0; i < messageBlocks.length; i++) {
      if (i > 0) await new Promise((res) => setTimeout(res, 800));
      await client.sendMessage(chatId, messageBlocks[i]);
    }
  } else {
    await client.sendMessage(chatId, fullMessage);
  }

  return { message: fullMessage, attachmentSent: false };
}

module.exports = { startSession, stopSession, getLatestQr, sendGreeting };
