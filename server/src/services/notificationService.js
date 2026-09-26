import nodemailer from 'nodemailer';
import db from '../db.js';

/**
 * Helper to fetch latest hostel settings
 */
export function getHostelSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return {
    hostel_name: settings.hostel_name || 'RISE A CHILD CHILDREN HOME',
    founder_name: settings.founder_name || 'BRO .NELSON',
    contact_phone: settings.contact_phone || '+91 90594 91777',
    contact_email: settings.contact_email || 'pn9059491777@gmail.com',
    notification_email: settings.notification_email || settings.contact_email || 'pn9059491777@gmail.com',
    contact_address: settings.contact_address || 'Mannar Polur, Sullurpeta Mandal, Tirupati District, Andhra Pradesh - 524121',
    smtp_host: settings.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com',
    smtp_port: parseInt(settings.smtp_port || process.env.SMTP_PORT || '465'),
    smtp_user: settings.smtp_user || process.env.SMTP_USER || settings.contact_email || 'pn9059491777@gmail.com',
    smtp_pass: settings.smtp_pass || process.env.SMTP_PASS || '',
    smtp_sender_name: settings.smtp_sender_name || 'RISE A CHILD CHILDREN HOME Admissions'
  };
}

/**
 * Create SMTP transporter with robust Gmail and standard SMTP support
 */
function createSmtpTransporter(config) {
  const user = (config.smtp_user || config.contact_email || '').trim();
  const pass = (config.smtp_pass || '').trim();

  if (!user || !pass) {
    return null;
  }

  const isGmail = (config.smtp_host || '').toLowerCase().includes('gmail');
  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  return nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_port === 465,
    auth: { user, pass }
  });
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
    subject: `Admission Decision: Application ${appNo} - ${status} | ${config.hostel_name}`
  };
}

/**
 * Build HTML email template for admission decision
 */
function buildHtmlDecisionEmail(app, status, messageObj, config) {
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
          <span style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: ${statusColor}; letter-spacing: 1px;">Application Decision</span>
          <h2 style="margin: 4px 0 0 0; font-size: 18px; color: ${statusColor}; font-weight: 700;">${status === 'Accepted' ? '🎉 Application Approved & Accepted' : status === 'Rejected' ? '📋 Application Not Approved' : '🔍 Application Under Review'}</h2>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; width: 40%;">Application Number:</td>
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
 * Dispatch an email notification to the hostel administration when a new application is submitted online
 */
export async function sendNewApplicationAlertToAdmin(app) {
  const config = getHostelSettings();
  const recipient = config.notification_email || config.contact_email || 'pn9059491777@gmail.com';
  const transporter = createSmtpTransporter(config);

  const subject = `🚨 [NEW ADMISSION APPLICATION] ${app.app_no} - ${app.child_name} (Class: ${app.class_applying})`;

  const textContent = `NEW ADMISSION APPLICATION RECEIVED
======================================================
Application Number : ${app.app_no}
Child Name         : ${app.child_name}
Age & Gender       : ${app.age} years | ${app.gender}
Date of Birth      : ${app.dob || 'Not provided'}
Class Applying     : ${app.class_applying}

Guardian Details
------------------------------------------------------
Guardian Name      : ${app.guardian_name}
Contact Phone      : ${app.phone}
Guardian Email     : ${app.email || 'None provided'}
Address            : ${app.address}
Previous School    : ${app.previous_school || 'Not specified'}

Reason for Hostel Admission
------------------------------------------------------
${app.reason}

Referral Source    : ${app.hear_about || 'Website'}
Submission Time    : ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
======================================================
Log in to your Admin Dashboard to Review, Accept, or Reject this application:
http://localhost:5000/#admin
`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background: linear-gradient(135deg, #065f46 0%, #0f172a 100%); padding: 24px; text-align: center; color: #ffffff;">
        <span style="background: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px;">New Online Application</span>
        <h1 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">${config.hostel_name}</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Admissions Desk Notification</p>
      </div>

      <div style="padding: 24px;">
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #065f46;">A new admission application has been submitted online!</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #047857;">Application Ref: <strong>${app.app_no}</strong></p>
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin: 16px 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Student Profile</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; width: 35%;">Child Full Name:</td><td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${app.child_name}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b;">Class Applying:</td><td style="padding: 6px 0; font-weight: 700; color: #065f46;">${app.class_applying}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b;">Age & Gender:</td><td style="padding: 6px 0; font-weight: 600;">${app.age} years • ${app.gender}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b;">Date of Birth:</td><td style="padding: 6px 0; font-weight: 600;">${app.dob || 'Not provided'}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Previous School:</td><td style="padding: 6px 0; font-weight: 600;">${app.previous_school || 'None'}</td></tr>
        </table>

        <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin: 16px 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Guardian & Contact</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b; width: 35%;">Guardian Name:</td><td style="padding: 6px 0; font-weight: 700;">${app.guardian_name}</td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b;">Phone Number:</td><td style="padding: 6px 0; font-weight: 700;"><a href="tel:${app.phone}" style="color: #065f46; text-decoration: none;">${app.phone}</a></td></tr>
          <tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0; color: #64748b;">Guardian Email:</td><td style="padding: 6px 0; font-weight: 600;">${app.email ? `<a href="mailto:${app.email}" style="color: #2563eb;">${app.email}</a>` : 'None provided'}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Address:</td><td style="padding: 6px 0; font-weight: 600;">${app.address}</td></tr>
        </table>

        <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin: 16px 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Reason for Admission</h3>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          ${app.reason}
        </div>

        <div style="text-align: center; margin: 24px 0 12px 0;">
          <a href="http://localhost:5000/#admin" style="display: inline-block; background: #065f46; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Open Admin Dashboard to Review Application
          </a>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${config.smtp_sender_name}" <${config.smtp_user || config.contact_email}>`,
        to: recipient,
        subject,
        text: textContent,
        html: htmlContent
      });
      console.log(`[ADMIN NOTIFICATION EMAIL SENT] Delivered new application ${app.app_no} to ${recipient}`);
      return { success: true, delivered: true, recipient };
    } catch (err) {
      console.error('[ADMIN NOTIFICATION EMAIL ERROR]', err.message);
      return { success: false, delivered: false, error: err.message, recipient };
    }
  } else {
    console.log(`=======================================================`);
    console.log(`[NEW ADMISSION SUBMITTED - ADMIN ALERT LOGGED]`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Subject: ${subject}`);
    console.log(textContent);
    console.log(`=======================================================`);
    return { success: true, delivered: false, simulated: true, recipient };
  }
}

/**
 * Send an acknowledgment confirmation to the applicant's email if provided
 */
export async function sendApplicationReceivedConfirmationToApplicant(app) {
  if (!app.email || !app.email.includes('@')) {
    return { success: false, reason: 'No email provided by applicant' };
  }

  const config = getHostelSettings();
  const transporter = createSmtpTransporter(config);
  const subject = `✅ Admission Application Registered: ${app.app_no} - ${app.child_name} | ${config.hostel_name}`;

  const textContent = `Dear ${app.guardian_name},

Thank you for submitting the residential schooling admission application for ${app.child_name} (Class: ${app.class_applying}) at ${config.hostel_name}.

Your application reference number is: ${app.app_no}

Application Details:
- Child Name: ${app.child_name}
- Class Applying For: ${app.class_applying}
- Registered Phone: ${app.phone}
- Date Submitted: ${new Date().toLocaleDateString('en-IN')}

Next Steps:
1. Our Admissions Committee will carefully review your application against our residential bed capacity and age guidelines.
2. You can track your application status at any time on our website admissions page using your Application Number (${app.app_no}) and Phone Number (${app.phone}).
3. A representative or warden may contact you directly if document verification or additional information is required.

Campus Contact:
${config.hostel_name}
Address: ${config.contact_address}
Phone: ${config.contact_phone}
Email: ${config.contact_email}

Warm regards,
${config.founder_name}
${config.hostel_name}
`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">${config.hostel_name}</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Admission Application Acknowledgment</p>
      </div>

      <div style="padding: 24px;">
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #065f46;">Application Received & Registered Successfully!</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #047857;">Your Reference Number: <strong style="font-family: monospace; font-size: 14px;">${app.app_no}</strong></p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          Dear <strong>${app.guardian_name}</strong>,<br><br>
          Thank you for applying for residential schooling and care for <strong>${app.child_name}</strong> (Class: <strong>${app.class_applying}</strong>) at ${config.hostel_name}.
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0; background: #f8fafc; border-radius: 8px; padding: 12px;">
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; color: #64748b;">Application Number:</td><td style="padding: 8px; font-weight: 700; font-family: monospace;">${app.app_no}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; color: #64748b;">Student Name:</td><td style="padding: 8px; font-weight: 700;">${app.child_name}</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px; color: #64748b;">Class Applied:</td><td style="padding: 8px; font-weight: 600;">${app.class_applying}</td></tr>
          <tr><td style="padding: 8px; color: #64748b;">Current Status:</td><td style="padding: 8px; font-weight: 700; color: #d97706;">Pending Review</td></tr>
        </table>

        <div style="font-size: 13px; line-height: 1.6; color: #475569; margin: 16px 0;">
          <strong>What Happens Next:</strong>
          <ol style="padding-left: 18px; margin: 6px 0;">
            <li>Our Admissions Committee will evaluate the application.</li>
            <li>You will receive an automated email and WhatsApp notification once a decision is made.</li>
            <li>You can track the live status anytime using the Admission Desk on our official website.</li>
          </ol>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 20px; font-size: 12px; color: #64748b;">
          <p style="margin: 0;"><strong>Campus Address:</strong> ${config.contact_address}</p>
          <p style="margin: 4px 0 0 0;"><strong>Contact Office:</strong> ${config.contact_phone} | ${config.contact_email}</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${config.smtp_sender_name}" <${config.smtp_user || config.contact_email}>`,
        to: app.email,
        subject,
        text: textContent,
        html: htmlContent
      });
      console.log(`[APPLICANT CONFIRMATION EMAIL SENT] Sent acknowledgment to ${app.email}`);
      return { success: true, delivered: true, recipient: app.email };
    } catch (err) {
      console.error('[APPLICANT CONFIRMATION EMAIL ERROR]', err.message);
      return { success: false, delivered: false, error: err.message };
    }
  } else {
    console.log(`[APPLICANT CONFIRMATION LOGGED] ${app.email} - Ref: ${app.app_no}`);
    return { success: true, delivered: false, simulated: true };
  }
}

/**
 * Main dispatcher: Sends automated decision email to applicant + generates WhatsApp link + records in DB
 */
export async function dispatchAdmissionNotification(app, newStatus, adminNotes = '') {
  const config = getHostelSettings();
  const messageObj = formatAdmissionMessage(app, newStatus, adminNotes);
  const transporter = createSmtpTransporter(config);

  let emailSent = false;
  let emailError = null;

  // 1. Process automated email if applicant provided an email address
  if (app.email && app.email.includes('@')) {
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"${config.smtp_sender_name}" <${config.smtp_user || config.contact_email}>`,
          to: app.email,
          subject: messageObj.subject,
          text: messageObj.fullText,
          html: buildHtmlDecisionEmail(app, newStatus, messageObj, config)
        });
        emailSent = true;
        console.log(`[DECISION EMAIL DISPATCHED] Successfully sent ${newStatus} to applicant: ${app.email}`);
      } catch (err) {
        console.error('[DECISION EMAIL DISPATCH ERROR]', err.message);
        emailError = err.message;
      }
    } else {
      console.log(`=======================================================`);
      console.log(`[ADMISSION DECISION NOTIFICATION - SMTP NOT CONFIGURED]`);
      console.log(`To: ${app.email} (${app.guardian_name})`);
      console.log(`Status: ${newStatus}`);
      console.log(`Subject: ${messageObj.subject}`);
      console.log(`Content:\n${messageObj.fullText}`);
      console.log(`=======================================================`);
      emailSent = false;
      emailError = 'SMTP credentials not configured in Admin Settings';
    }
  }

  // 2. Generate WhatsApp Web / App link for one-click mobile dispatch
  let cleanPhone = (app.phone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageObj.fullText)}`;

  // 3. Update database record with notification timestamp & type
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const notifType = app.email ? 'Email + WhatsApp Ready' : 'WhatsApp / Phone Ready';
  const notifStatus = emailSent ? `Email Sent (${newStatus})` : emailError ? `Ready to Send (${newStatus})` : `Ready (${newStatus})`;

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

/**
 * Send a test email to verify SMTP configuration
 */
export async function testSmtpConnection(testRecipient) {
  const config = getHostelSettings();
  const recipient = testRecipient || config.notification_email || config.contact_email;
  const transporter = createSmtpTransporter(config);

  if (!transporter) {
    throw new Error('SMTP password or username is missing. Please enter your SMTP username and password in Settings.');
  }

  // Verify connection
  await transporter.verify();

  // Send test email
  const info = await transporter.sendMail({
    from: `"${config.smtp_sender_name}" <${config.smtp_user || config.contact_email}>`,
    to: recipient,
    subject: `✅ SMTP Verification Successful: ${config.hostel_name}`,
    text: `Congratulations!\n\nYour SMTP email delivery configuration for ${config.hostel_name} is active and working properly.\n\nAll new online admission alerts will be delivered to this email, and decision updates will be automatically dispatched to applicants.\n\nSent at: ${new Date().toLocaleString()}`,
    html: `
    <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px;">
      <h2 style="color: #065f46; margin-top: 0;">✅ SMTP Test Succeeded!</h2>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">Your email system for <strong>${config.hostel_name}</strong> is completely operational.</p>
      <ul style="color: #64748b; font-size: 13px;">
        <li>New online admissions will send an immediate alert here: <strong>${recipient}</strong></li>
        <li>Approved / Rejected decisions will be automatically sent to the applicant's email address.</li>
      </ul>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">Timestamp: ${new Date().toLocaleString()}</p>
    </div>
    `
  });

  return { success: true, messageId: info.messageId, recipient };
}
