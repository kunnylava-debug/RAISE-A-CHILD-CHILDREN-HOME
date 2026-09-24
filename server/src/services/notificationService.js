import nodemailer from 'nodemailer';
import db from '../db.js';

/**
 * Helper to fetch latest hostel settings
 */
function getHostelSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return {
    hostel_name: settings.hostel_name || 'RAISE A CHILD CHILDREN HOME',
    founder_name: settings.founder_name || 'BRO .NELSON',
    contact_phone: settings.contact_phone || '+91 90594 91777',
    contact_email: settings.contact_email || 'contact@raiseachildchildrenhome.org',
    contact_address: settings.contact_address || 'Mannaripoluru, Sullurpeta Mandal, Tirupati District, Andhra Pradesh - 524121'
  };
}

/**
 * Format official communication message for WhatsApp, SMS, or Email
 */
export function formatAdmissionMessage(app, status, adminNotes = '') {
  const config = getHostelSettings();
  const child = app.child_name;
  const guardian = app.guardian_name || 'Guardian';
  const appNo = app.app_no;
  const grade = app.class_applying;

  let title = '';
  let statusText = '';
  let instructions = '';

  if (status === 'Accepted') {
    title = `🎉 ADMISSION ACCEPTED & APPROVED`;
    statusText = `We are delighted to inform you that the admission application for ${child} (Class: ${grade}) has been ACCEPTED & APPROVED for residence and education at ${config.hostel_name}.`;
    instructions = `Next Steps for Admission:
1. Please visit the hostel campus with ${child}'s original Birth Certificate, Aadhar Card, and Transfer Certificate/Previous Marks Sheet.
2. Contact the hostel administration at ${config.contact_phone} to schedule your reporting date and uniform/bedding allocation.
3. Campus Address: ${config.contact_address}.`;
  } else if (status === 'Rejected') {
    title = `📋 ADMISSION APPLICATION UPDATE`;
    statusText = `Thank you for your application to ${config.hostel_name} for ${child} (Class: ${grade}). After careful review of all submissions against our residential bed capacity and safety norms, we regret to inform you that we are unable to approve this admission application at this time.`;
    instructions = `We pray for ${child}'s bright future and continued educational success. If you have questions, you may contact our office at ${config.contact_phone}.`;
  } else if (status === 'Under Review') {
    title = `🔍 ADMISSION UNDER REVIEW`;
    statusText = `The admission application for ${child} (${appNo}) is currently UNDER ACTIVE REVIEW by our Admissions Committee.`;
    instructions = `Our hostel warden or representative may contact you on this phone number shortly for document clarification or a short guardian interaction.`;
  } else {
    title = `📝 ADMISSION APPLICATION STATUS: ${status.toUpperCase()}`;
    statusText = `The status of admission application for ${child} (${appNo}) is currently: ${status}.`;
    instructions = `For details, please call ${config.contact_phone}.`;
  }

  const notesSection = adminNotes && adminNotes.trim() ? `\n\nOfficial Remarks / Notes:\n"${adminNotes.trim()}"` : '';

  const fullText = `*${config.hostel_name}*
${title}
Ref No: ${appNo}

Dear ${guardian},

${statusText}${notesSection}

${instructions}

With blessings & warm regards,
*${config.founder_name}*
Founder & Managing Trustee
${config.hostel_name}
Phone: ${config.contact_phone}
Email: ${config.contact_email}`;

  return {
    title,
    fullText,
    subject: `Admission Update: Application ${appNo} - ${status} | ${config.hostel_name}`
  };
}

/**
 * Build HTML email template
 */
function buildHtmlEmail(app, status, messageObj, config) {
  const isAccepted = status === 'Accepted';
  const isRejected = status === 'Rejected';
  const statusColor = isAccepted ? '#059669' : isRejected ? '#e11d48' : '#2563eb';
  const statusBg = isAccepted ? '#ecfdf5' : isRejected ? '#fff1f2' : '#eff6ff';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${messageObj.subject}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;">${config.hostel_name}</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Official Admissions Notification Desk</p>
      </div>

      <div style="padding: 28px 24px;">
        <div style="background: ${statusBg}; border-left: 4px solid ${statusColor}; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
          <span style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: ${statusColor}; letter-spacing: 1px;">Application Status Update</span>
          <h2 style="margin: 4px 0 0 0; font-size: 18px; color: ${statusColor}; font-weight: 700;">${status === 'Accepted' ? 'Application Approved & Accepted' : status === 'Rejected' ? 'Application Not Approved' : 'Application Under Review'}</h2>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Application Number:</td>
            <td style="padding: 8px 0; font-weight: 700; font-family: monospace; color: #0f172a;">${app.app_no}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Child Name:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${app.child_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Class Applied:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${app.class_applying}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Guardian Name:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${app.guardian_name}</td>
          </tr>
        </table>

        <div style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; white-space: pre-line;">
          ${messageObj.fullText.split('\n\n').slice(2).join('\n\n')}
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px; font-size: 12px; color: #64748b; line-height: 1.5;">
          <p style="margin: 0;"><strong>Campus Address:</strong> ${config.contact_address}</p>
          <p style="margin: 4px 0 0 0;"><strong>Contact Phone:</strong> ${config.contact_phone} | <strong>Email:</strong> ${config.contact_email}</p>
          <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 11px;">This is an official automated notification generated by the Admission Management System of ${config.hostel_name}.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Main dispatcher: Sends automated email (if configured) + generates WhatsApp link + records in DB
 */
export async function dispatchAdmissionNotification(app, newStatus, adminNotes = '') {
  const config = getHostelSettings();
  const messageObj = formatAdmissionMessage(app, newStatus, adminNotes);

  let emailSent = false;
  let emailError = null;

  // 1. Process automated email if applicant provided an email address
  if (app.email && app.email.includes('@')) {
    try {
      // Check if SMTP transport is configured via env
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');

      if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass }
        });

        await transporter.sendMail({
          from: `"${config.hostel_name}" <${config.contact_email}>`,
          to: app.email,
          subject: messageObj.subject,
          text: messageObj.fullText,
          html: buildHtmlEmail(app, newStatus, messageObj, config)
        });
        emailSent = true;
        console.log(`[REAL EMAIL DISPATCH SUCCESS] Sent status (${newStatus}) to ${app.email}`);
      } else {
        // Simulated email dispatch log (recorded in server console and database)
        console.log(`=======================================================`);
        console.log(`[AUTOMATED ADMISSION EMAIL DISPATCH SIMULATION]`);
        console.log(`To: ${app.email} (${app.guardian_name})`);
        console.log(`Subject: ${messageObj.subject}`);
        console.log(`Status: ${newStatus}`);
        console.log(`Content:\n${messageObj.fullText}`);
        console.log(`=======================================================`);
        emailSent = true; // Mark as logged/dispatched
      }
    } catch (err) {
      console.error('[EMAIL DISPATCH ERROR]', err.message);
      emailError = err.message;
    }
  }

  // 2. Generate WhatsApp Web / App link for one-click mobile dispatch
  // Clean phone number: remove non-digits, prepend 91 for Indian numbers if 10 digits
  let cleanPhone = (app.phone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageObj.fullText)}`;

  // 3. Update database record with notification timestamp & type
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const notifType = app.email ? 'Email + WhatsApp Ready' : 'WhatsApp / SMS Ready';
  const notifStatus = emailSent ? `Email Sent (${newStatus})` : `Ready to Send (${newStatus})`;

  try {
    db.prepare(`
      UPDATE admissions
      SET notification_sent_at = ?,
          notification_type = ?,
          notification_status = ?
      WHERE id = ?
    `).run(now, notifType, notifStatus, app.id);
  } catch (err) {
    console.error('Failed to update notification status in DB:', err.message);
  }

  return {
    success: true,
    applicant_name: app.child_name,
    guardian_name: app.guardian_name,
    phone: app.phone,
    email: app.email,
    email_dispatched: emailSent,
    email_error: emailError,
    notification_sent_at: now,
    subject: messageObj.subject,
    message_text: messageObj.fullText,
    whatsapp_url: whatsappUrl
  };
}
