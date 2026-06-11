// Tiny email abstraction.
//   EMAIL_DRIVER=console -> log to stdout (zero config, perfect for local dev)
//   EMAIL_DRIVER=smtp    -> send via a real SMTP server (Gmail / SES / Mailgun / SendGrid SMTP)
//
// Only one provider is loaded at runtime; old codebase had three competing
// email packages installed (nodemailer + @sendgrid/mail + sib-api-v3-sdk).

const env = require('../config/env');
const logger = require('../utils/logger');

let smtpTransporter = null;

const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;
  // eslint-disable-next-line global-require
  const nodemailer = require('nodemailer');
  smtpTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return smtpTransporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  if (env.EMAIL_DRIVER === 'console') {
    logger.info(`[email/console] to=${to} subject=${subject}\n${text || html}`);
    return { driver: 'console', to, subject };
  }

  const transporter = getSmtpTransporter();
  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });
  logger.info(`email sent: id=${info.messageId} to=${to}`);
  return { driver: 'smtp', messageId: info.messageId };
};

const renderResetEmail = (resetLink) => ({
  subject: 'Reset your Expense App password',
  text: `Reset your password: ${resetLink}\n\nThis link expires in 30 minutes.`,
  html: `
    <div style="font-family: -apple-system, sans-serif; max-width: 540px; margin: auto; padding: 24px;">
      <h2 style="color:#1f2937;">Reset your password</h2>
      <p style="color:#4b5563;">We received a request to reset your Expense App password.</p>
      <p>
        <a href="${resetLink}"
           style="display:inline-block;padding:10px 18px;background:#3b62f6;color:white;
                  border-radius:8px;text-decoration:none;font-weight:600;">
          Reset password
        </a>
      </p>
      <p style="color:#9ca3af;font-size:12px;">
        This link expires in 30 minutes. If you didn't request this, you can safely ignore the email.
      </p>
    </div>
  `,
});

module.exports = { sendMail, renderResetEmail };
