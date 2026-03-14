const nodemailer = require('nodemailer');
const { User, Notification } = require('../models');

// Configure NodeMailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Creates a system notification and emails all verified users.
 * @param {string} title 
 * @param {string} message 
 * @param {string} type - 'info', 'success', 'warning', 'error'
 */
const notifyAllUsers = async (title, message, type = 'info') => {
  try {
    // 1. Save Notification to DB for UI Dropdown
    await Notification.create({ title, message, type });

    // 2. Fetch all verified users to email them
    const verifiedUsers = await User.findAll({ where: { isVerified: true } });
    if (verifiedUsers.length === 0) return;

    // Pluck out emails array
    const emails = verifiedUsers.map(user => user.email).join(',');

    // 3. Send Broadcast Email
    const transporter = createTransporter();
    
    // Build Color based on type
    const colors = {
      info: '#3b82f6', // blue
      success: '#10b981', // green
      warning: '#f59e0b', // yellow
      error: '#ef4444' // red
    };
    const accentColor = colors[type] || colors.info;

    const mailOptions = {
      from: '"CoreInventory System" <noreply@coreinventory.com>',
      to: emails, // Sending to multiple BCC or TO? Best is BCC for privacy, but TO is fine for an internal company app
      subject: `[CoreInventory] ${title}`,
      text: `${title}\n\n${message}\n\nPlease check the CoreInventory dashboard for more details.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${accentColor}; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">${title}</h2>
          </div>
          <div style="padding: 20px; background-color: #f9fafb;">
            <p style="font-size: 16px; color: #374151; line-height: 1.5;">${message}</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 14px; color: #6b7280;">Log in to the CoreInventory dashboard to view current inventory status and full details.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Notifier] Broadcasted ${type} notification to ${verifiedUsers.length} users.`);
  } catch (error) {
    console.error('[Notifier] Failed to send notification:', error);
  }
};

module.exports = { notifyAllUsers };
