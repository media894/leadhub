const nodemailer = require('nodemailer');
const { decrypt } = require('../config/crypto');
const Settings = require('../models/Settings');

function fillTemplate(template, lead) {
  return template
    .replace(/{{\s*name\s*}}/gi, lead.senderName || 'there')
    .replace(/{{\s*product\s*}}/gi, lead.productName || 'your requirement')
    .replace(/{{\s*company\s*}}/gi, lead.senderCompany || '');
}

async function testSmtpConnection(smtpSettings) {
  const transporter = nodemailer.createTransport({
    host: smtpSettings.host,
    port: Number(smtpSettings.port) || 587,
    secure: !!smtpSettings.secure,
    auth: { user: smtpSettings.user, pass: decrypt(smtpSettings.pass) },
  });
  await transporter.verify();
  return true;
}

async function getAdminTransporter() {
  const adminSettings = await Settings.findOne({}).sort({ createdAt: 1 });
  if (!adminSettings || !adminSettings.smtp || !adminSettings.smtp.host || !adminSettings.smtp.user) {
    return null;
  }
  let pass = '';
  try {
    pass = decrypt(adminSettings.smtp.pass);
  } catch (e) {
    pass = adminSettings.smtp.pass;
  }
  return {
    transporter: nodemailer.createTransport({
      host: adminSettings.smtp.host,
      port: Number(adminSettings.smtp.port) || 587,
      secure: !!adminSettings.smtp.secure,
      auth: { user: adminSettings.smtp.user, pass },
    }),
    senderEmail: adminSettings.smtp.user,
    fromName: adminSettings.smtp.fromName || 'LeadHub Admin',
  };
}

async function sendAdminRegistrationAlert({ newUser, approvalUrl }) {
  try {
    const adminSmtp = await getAdminTransporter();
    if (!adminSmtp) {
      console.log(`[admin_alert] SMTP not configured. Direct approval link: ${approvalUrl}`);
      return;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #f59e0b;">
        <h2 style="color: #f59e0b; margin-top: 0; font-size: 20px;">🚨 New LeadHub Registration Approval Required</h2>
        <p style="color: #cbd5e1; font-size: 14px;">A new user has registered on LeadHub and requires your approval to access the application:</p>
        
        <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
          <p style="margin: 8px 0; color: #f8fafc; font-size: 14px;"><strong>👤 Full Name:</strong> ${newUser.name}</p>
          <p style="margin: 8px 0; color: #f8fafc; font-size: 14px;"><strong>✉️ Email Address:</strong> ${newUser.email}</p>
          <p style="margin: 8px 0; color: #f8fafc; font-size: 14px;"><strong>🏢 Company:</strong> ${newUser.companyName || 'Not specified'}</p>
          <p style="margin: 8px 0; color: #f8fafc; font-size: 14px;"><strong>🕒 Date Registered:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="text-align: center; margin-top: 28px; margin-bottom: 10px;">
          <a href="${approvalUrl}" target="_blank" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
            ✅ APPROVE USER ACCESS NOW
          </a>
        </div>
        <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 15px;">
          Clicking the button above will instantly activate the user's account and send them a welcome email.
        </p>
      </div>
    `;

    await adminSmtp.transporter.sendMail({
      from: `"${adminSmtp.fromName}" <${adminSmtp.senderEmail}>`,
      to: adminSmtp.senderEmail, // Send alert to Admin email address
      subject: `🚨 Action Required: Approve New User ${newUser.name} (${newUser.email})`,
      html,
    });
    console.log(`[admin_alert] Sent registration approval alert to Admin email (${adminSmtp.senderEmail}).`);
  } catch (err) {
    console.error(`[admin_alert] Error sending admin alert email:`, err.message);
  }
}

async function sendUserApprovalNotice({ user }) {
  try {
    const adminSmtp = await getAdminTransporter();
    if (!adminSmtp) return;

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #10b981;">
        <h2 style="color: #10b981; margin-top: 0; font-size: 20px;">🎉 Your LeadHub Account Has Been Activated!</h2>
        <p style="color: #cbd5e1; font-size: 14px;">Hi ${user.name},</p>
        <p style="color: #cbd5e1; font-size: 14px;">Great news! Your LeadHub account access has been approved by Admin. You can now log in and start pulling your IndiaMART leads & automated proposals.</p>
        
        <div style="text-align: center; margin-top: 28px; margin-bottom: 10px;">
          <a href="http://localhost:5173/login" target="_blank" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
            🔑 LOGIN TO LEADHUB NOW
          </a>
        </div>
      </div>
    `;

    await adminSmtp.transporter.sendMail({
      from: `"${adminSmtp.fromName}" <${adminSmtp.senderEmail}>`,
      to: user.email,
      subject: `🎉 Account Activated - Welcome to LeadHub!`,
      html,
    });
    console.log(`[user_notice] Sent approval welcome email to ${user.email}.`);
  } catch (err) {
    console.error(`[user_notice] Error sending user notice email:`, err.message);
  }
}

async function sendProposalEmail({ smtpSettings, templates, lead, attachment }) {
  if (!smtpSettings.host || !smtpSettings.user || !smtpSettings.pass) {
    throw new Error('SMTP is not configured yet. Add it in Settings first.');
  }
  if (!lead.senderEmail) {
    throw new Error('This lead has no email address.');
  }

  const transporter = nodemailer.createTransport({
    host: smtpSettings.host,
    port: Number(smtpSettings.port) || 587,
    secure: !!smtpSettings.secure,
    auth: { user: smtpSettings.user, pass: decrypt(smtpSettings.pass) },
  });

  const subject = fillTemplate(templates.emailSubject, lead);
  const text = fillTemplate(templates.emailBody, lead);

  const isImageOrGif =
    attachment &&
    (attachment.filename || attachment.path) &&
    /\.(gif|png|jpg|jpeg|webp)$/i.test(attachment.filename || attachment.path);

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #2d3748; line-height: 1.6; max-width: 600px; padding: 10px 0;">
      <div>${text.replace(/\n/g, '<br/>')}</div>
      ${
        isImageOrGif
          ? '<div style="margin-top: 20px;"><img src="cid:email_attachment_gif" style="max-width: 100%; max-height: 450px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" alt="Proposal Attachment GIF" /></div>'
          : ''
      }
    </div>
  `;

  const mailOptions = {
    from: `"${smtpSettings.fromName || 'Odd Infotech'}" <${smtpSettings.user}>`,
    to: lead.senderEmail,
    subject,
    text,
    html,
  };

  if (attachment && attachment.path) {
    const path = require('path');
    const fullPath =
      attachment.path.startsWith('/') || attachment.path.includes(':')
        ? path.join(__dirname, '..', attachment.path)
        : attachment.path;
    mailOptions.attachments = [
      {
        filename: attachment.filename || 'attachment',
        path: fullPath,
        cid: isImageOrGif ? 'email_attachment_gif' : undefined,
      },
    ];
  }

  await transporter.sendMail(mailOptions);

  return { subject, text };
}

module.exports = {
  sendProposalEmail,
  testSmtpConnection,
  fillTemplate,
  sendAdminRegistrationAlert,
  sendUserApprovalNotice,
};
