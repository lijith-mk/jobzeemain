const nodemailer = require('nodemailer');

// Create reusable transporter object using the Gmail SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    // Enhanced settings for better deliverability
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000, // 1 second between emails
    rateLimit: 5, // max 5 emails per rateDelta
    // Add proper headers for better delivery
    defaults: {
      from: `"JobZee - Password Reset" <${process.env.EMAIL_FROM}>`,
    }
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userType = 'user') => {
  try {
    const transporter = createTransporter();

    // Determine reset URL based on user type
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = userType === 'employer'
      ? `${baseUrl}/employer/reset-password/${resetToken}`
      : `${baseUrl}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"JobZee - Password Reset" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: '🔒 Reset Your JobZee Password - Action Required',
      // Add headers for better deliverability
      headers: {
        'X-Mailer': 'JobZee Application',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'List-Unsubscribe': `<mailto:unsubscribe@jobzee.com>`,
        'Message-ID': `<${resetToken}@jobzee.com>`,
      },
      // Add envelope settings
      envelope: {
        from: process.env.EMAIL_FROM,
        to: email
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - Jobzee</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 300;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #333;
              margin-bottom: 20px;
              font-size: 24px;
            }
            .content p {
              margin-bottom: 20px;
              font-size: 16px;
              line-height: 1.6;
            }
            .reset-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 5px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .reset-button:hover {
              transform: translateY(-2px);
            }
            .token-box {
              background-color: #f8f9fa;
              border: 2px dashed #dee2e6;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
              text-align: center;
              font-family: 'Courier New', monospace;
              word-break: break-all;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
              border-top: 1px solid #dee2e6;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
              color: #856404;
            }
            .warning strong {
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Jobzee</h1>
            </div>
            
            <div class="content">
              <h2>Password Reset Request</h2>
              
              <p>Hello,</p>
              
              <p>We received a request to reset your password for your Jobzee ${userType} account. If you didn't make this request, you can safely ignore this email.</p>
              
              <p>To reset your password, click the button below:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="reset-button">Reset Your Password</a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <div class="token-box">
                ${resetUrl}
              </div>
              
              <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This link will expire in <strong>1 hour</strong> for security reasons</li>
                  <li>You can only use this link once</li>
                  <li>If you didn't request this reset, please contact our support team</li>
                </ul>
              </div>
              
              <p>For your security, this password reset link will expire in 1 hour. If you need a new reset link, please visit our password reset page again.</p>
              
              <p>Best regards,<br>
              The Jobzee Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>If you need help, contact us at support@jobzee.com</p>
              <p>&copy; 2024 Jobzee. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - Jobzee
        
        Hello,
        
        We received a request to reset your password for your Jobzee ${userType} account.
        
        To reset your password, visit this link:
        ${resetUrl}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        The Jobzee Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send mentor application status email
const sendMentorApplicationStatusEmail = async (mentorEmail, mentorName, status, reason = '') => {
  try {
    const transporter = createTransporter();

    const isApproved = status === 'approved';
    const subject = isApproved
      ? `🎉 Congratulations! Your Mentor Application is Approved - JobZee`
      : `Update on your Mentor Application - JobZee`;

    const mailOptions = {
      from: `"JobZee - Mentor Team" <${process.env.EMAIL_FROM}>`,
      to: mentorEmail,
      subject: subject,
      headers: {
        'X-Mailer': 'JobZee Application',
        'X-Priority': '1',
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, ${isApproved ? '#10B981 0%, #059669 100%' : '#EF4444 0%, #B91C1C 100%'}); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: ${isApproved ? '#10B981' : '#6B7280'}; color: white !important; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 14px; color: #6c757d; border-top: 1px solid #dee2e6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isApproved ? '🎉 Welcome Aboard!' : 'Application Update'}</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${mentorName},</h2>
              
              ${isApproved ? `
                <p>We are thrilled to inform you that your application to become a mentor on JobZee has been <strong>APPROVED</strong>!</p>
                <p>You can now log in to your dashboard, set up your availability, and start guiding aspiring professionals.</p>
                
                <div style="text-align: center;">
                  <a href="${process.env.FRONTEND_URL}/mentor/login" class="button">Go to Dashboard</a>
                </div>
              ` : `
                <p>Thank you for your interest in becoming a mentor on JobZee. After careful review, we regret to inform you that we cannot move forward with your application at this time.</p>
                
                ${reason ? `<div style="background: #FFF5F5; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;"><strong>Reason:</strong> ${reason}</div>` : ''}
                
                <p>You may re-apply in the future if your qualifications change or if you believe this decision was made in error.</p>
              `}
              
              <p>Best regards,<br>The JobZee Team</p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} JobZee. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Mentor application status email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending mentor status email:', error);
    // Don't throw to prevent blocking the main process
    return { success: false, error: error.message };
  }
};

// Send session invoice email
const sendSessionInvoiceEmail = async (userEmail, userName, sessionDetails, invoiceLink) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"JobZee - Billing" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: `✅ Booking Confirmed & Invoice - ${sessionDetails.title}`,
      headers: {
        'X-Mailer': 'JobZee Application',
        'X-Priority': '1',
      },
      html: `
         <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Invoice</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .session-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #6366f1; color: white !important; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 14px; color: #6c757d; border-top: 1px solid #dee2e6; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .label { font-weight: 600; color: #64748b; }
            .value { font-weight: 500; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed!</h1>
              <p>Your session is scheduled successfully</p>
            </div>
            
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Thank you for booking a mentorship session with <strong>${sessionDetails.mentorName}</strong>. Your payment was successful and your slot is reserved.</p>
              
              <div class="session-card">
                <h3 style="margin-top: 0; color: #4f46e5;">Session Details</h3>
                
                <div class="detail-row">
                  <span class="label">Topic:</span>
                  <span class="value">${sessionDetails.title}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${new Date(sessionDetails.date).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span class="value">${sessionDetails.time}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Amount Paid:</span>
                  <span class="value">${sessionDetails.currency} ${sessionDetails.amount}</span>
                </div>
              </div>

              <div style="text-align: center;">
                 <p>You can download your invoice using the link below:</p>
                 <a href="${invoiceLink}" class="button">Download Invoice</a>
              </div>

              <p>We've also attached the meeting details to your dashboard. Please join on time.</p>
              
              <p>Best regards,<br>The JobZee Team</p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} JobZee. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Session invoice email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending session invoice email:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email service is ready to send emails');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
};

// Send ticket confirmation email with QR code
const sendTicketEmail = async (userEmail, userName, ticket, event) => {
  try {
    const transporter = createTransporter();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const ticketUrl = `${baseUrl}/ticket/${ticket.ticketId}`;

    const mailOptions = {
      from: `"JobZee - Event Tickets" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: `🎫 Your Event Ticket - ${event.title}`,
      headers: {
        'X-Mailer': 'JobZee Application',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'Message-ID': `<${ticket.ticketId}@jobzee.com>`,
      },
      envelope: {
        from: process.env.EMAIL_FROM,
        to: userEmail
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Ticket - Jobzee</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 300;
            }
            .content {
              padding: 40px 30px;
            }
            .ticket-card {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border: 2px solid #dee2e6;
              border-radius: 15px;
              padding: 30px;
              margin: 20px 0;
              text-align: center;
            }
            .qr-code {
              background: white;
              border: 2px solid #dee2e6;
              border-radius: 10px;
              padding: 20px;
              margin: 20px auto;
              display: inline-block;
              max-width: 300px;
            }
            .qr-code img {
              max-width: 100%;
              height: auto;
            }
            .ticket-info {
              background-color: #f8f9fa;
              border-radius: 10px;
              padding: 20px;
              margin: 20px 0;
            }
            .ticket-info h3 {
              color: #495057;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #6c757d;
            }
            .info-value {
              color: #495057;
            }
            .event-details {
              background-color: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 20px;
              margin: 20px 0;
            }
            .event-details h3 {
              color: #1976d2;
              margin-bottom: 15px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 8px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
              border-top: 1px solid #dee2e6;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-valid {
              background-color: #d4edda;
              color: #155724;
            }
            .ticket-id {
              font-family: 'Courier New', monospace;
              background-color: #f8f9fa;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎫 Jobzee</h1>
              <p>Your Event Ticket is Ready!</p>
            </div>
            
            <div class="content">
              <h2>Hello ${userName}!</h2>
              
              <p>Congratulations! You have successfully registered for <strong>${event.title}</strong>. Your ticket is attached below.</p>
              
              <div class="ticket-card">
                <h3>🎫 Your Event Ticket</h3>
                
                ${ticket.qrImageUrl ? `
                <div class="qr-code">
                  <img src="${ticket.qrImageUrl}" alt="QR Code" />
                  <p style="margin-top: 10px; font-size: 12px; color: #6c757d;">
                    Show this QR code at the event entrance
                  </p>
                </div>
                ` : `
                <div class="qr-code">
                  <p>QR Code will be generated shortly</p>
                </div>
                `}
                
                <div class="ticket-info">
                  <h3>Ticket Information</h3>
                  <div class="info-row">
                    <span class="info-label">Ticket ID:</span>
                    <span class="info-value">${ticket.ticketId}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value">
                      <span class="status-badge status-valid">${ticket.status.toUpperCase()}</span>
                    </span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Type:</span>
                    <span class="info-value">${ticket.ticketType}</span>
                  </div>
                  ${ticket.ticketType === 'Paid' ? `
                  <div class="info-row">
                    <span class="info-label">Price:</span>
                    <span class="info-value">₹${ticket.ticketPrice}</span>
                  </div>
                  ` : ''}
                  <div class="info-row">
                    <span class="info-label">Issued:</span>
                    <span class="info-value">${new Date(ticket.issuedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</span>
                  </div>
                </div>
              </div>
              
              <div class="event-details">
                <h3>📅 Event Details</h3>
                <div class="info-row">
                  <span class="info-label">Event:</span>
                  <span class="info-value">${event.title}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date & Time:</span>
                  <span class="info-value">${new Date(event.startDateTime).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Mode:</span>
                  <span class="info-value">${event.mode || 'Online'}</span>
                </div>
                ${event.mode === 'offline' && event.venueAddress ? `
                <div class="info-row">
                  <span class="info-label">Venue:</span>
                  <span class="info-value">${event.venueAddress}</span>
                </div>
                ` : ''}
                ${event.mode === 'online' && event.meetingLink ? `
                <div class="info-row">
                  <span class="info-label">Meeting Link:</span>
                  <span class="info-value"><a href="${event.meetingLink}" target="_blank">Join Meeting</a></span>
                </div>
                ` : ''}
              </div>
              
              <div style="text-align: center;">
                <a href="${ticketUrl}" class="cta-button">View Full Ticket Details</a>
              </div>
              
              <div class="ticket-id">
                <strong>QR Code Data:</strong><br>
                ${ticket.qrData}
              </div>
              
              <p><strong>Important Instructions:</strong></p>
              <ul>
                <li>Please arrive 15 minutes before the event starts</li>
                <li>Show this QR code at the event entrance for check-in</li>
                <li>Keep this email safe as it contains your ticket information</li>
                <li>If you can't attend, please contact the event organizer</li>
              </ul>
              
              <p>We look forward to seeing you at the event!</p>
              
              <p>Best regards,<br>
              The Jobzee Team</p>
            </div>
            
            <div class="footer">
              <p>This is your official event ticket. Please keep this email safe.</p>
              <p>If you have any questions, contact us at support@jobzee.com</p>
              <p>&copy; 2024 Jobzee. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Event Ticket - ${event.title}
        
        Hello ${userName}!
        
        Congratulations! You have successfully registered for ${event.title}.
        
        TICKET INFORMATION:
        - Ticket ID: ${ticket.ticketId}
        - Status: ${ticket.status.toUpperCase()}
        - Type: ${ticket.ticketType}
        ${ticket.ticketType === 'Paid' ? `- Price: ₹${ticket.ticketPrice}` : ''}
        - Issued: ${new Date(ticket.issuedAt).toLocaleString()}
        
        EVENT DETAILS:
        - Event: ${event.title}
        - Date & Time: ${new Date(event.startDateTime).toLocaleString()}
        - Mode: ${event.mode || 'Online'}
        ${event.mode === 'offline' && event.venueAddress ? `- Venue: ${event.venueAddress}` : ''}
        ${event.mode === 'online' && event.meetingLink ? `- Meeting Link: ${event.meetingLink}` : ''}
        
        QR Code Data: ${ticket.qrData}
        
        View your full ticket: ${ticketUrl}
        
        IMPORTANT INSTRUCTIONS:
        - Please arrive 15 minutes before the event starts
        - Show this QR code at the event entrance for check-in
        - Keep this email safe as it contains your ticket information
        - If you can't attend, please contact the event organizer
        
        We look forward to seeing you at the event!
        
        Best regards,
        The Jobzee Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Ticket email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending ticket email:', error);
    throw new Error('Failed to send ticket email');
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (customerEmail, customerName, order) => {
  try {
    const transporter = createTransporter();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const orderUrl = `${baseUrl}/orders/${order._id}`;

    const mailOptions = {
      from: `"JobZee Shop" <${process.env.EMAIL_FROM}>`,
      to: customerEmail,
      subject: `🎉 Order Confirmation - ${order.orderNumber}`,
      headers: {
        'X-Mailer': 'JobZee Application',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'Message-ID': `<${order.orderNumber}@jobzee.com>`,
      },
      envelope: {
        from: process.env.EMAIL_FROM,
        to: customerEmail
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation - Jobzee</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 300;
            }
            .content {
              padding: 40px 30px;
            }
            .order-card {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border: 2px solid #dee2e6;
              border-radius: 15px;
              padding: 30px;
              margin: 20px 0;
              text-align: center;
            }
            .order-number {
              font-family: 'Courier New', monospace;
              background-color: white;
              border: 2px solid #dee2e6;
              border-radius: 10px;
              padding: 15px;
              margin: 20px auto;
              display: inline-block;
              font-size: 18px;
              font-weight: bold;
              color: #10b981;
            }
            .order-info {
              background-color: #f8f9fa;
              border-radius: 10px;
              padding: 20px;
              margin: 20px 0;
            }
            .order-info h3 {
              color: #495057;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #6c757d;
            }
            .info-value {
              color: #495057;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              background-color: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .items-table th {
              background-color: #10b981;
              color: white;
              padding: 15px;
              text-align: left;
              font-weight: 600;
            }
            .items-table td {
              padding: 15px;
              border-bottom: 1px solid #e9ecef;
            }
            .items-table tr:last-child td {
              border-bottom: none;
            }
            .total-row {
              background-color: #f8f9fa;
              font-weight: bold;
              font-size: 18px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
              color: white !important;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 8px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              font-size: 14px;
              color: #6c757d;
              border-top: 1px solid #dee2e6;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-confirmed {
              background-color: #d4edda;
              color: #155724;
            }
            .download-section {
              background-color: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 20px;
              margin: 20px 0;
            }
            .download-section h3 {
              color: #1976d2;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Order Confirmed!</h1>
              <p>Thank you for your purchase, ${customerName}!</p>
            </div>
            
            <div class="content">
              <h2>Your Order Details</h2>
              
              <div class="order-card">
                <h3>Order Number</h3>
                <div class="order-number">${order.orderNumber}</div>
                <span class="status-badge status-confirmed">Confirmed</span>
              </div>
              
              <div class="order-info">
                <h3>Order Information</h3>
                <div class="info-row">
                  <span class="info-label">Order Date:</span>
                  <span class="info-value">${new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total Amount:</span>
                  <span class="info-value">${order.currency} ${order.total.toFixed(2)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment Status:</span>
                  <span class="info-value">Paid</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Order Status:</span>
                  <span class="info-value">${order.status}</span>
                </div>
              </div>
              
              <h3>Items Purchased</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                    <tr>
                      <td>
                        <strong>${item.productSnapshot?.name || 'Product'}</strong>
                        <br>
                        <small style="color: #6c757d;">${item.productSnapshot?.category || ''}</small>
                      </td>
                      <td>${item.quantity}</td>
                      <td>${order.currency} ${item.unitPrice.toFixed(2)}</td>
                      <td>${order.currency} ${item.totalPrice.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td colspan="3"><strong>Total Amount</strong></td>
                    <td><strong>${order.currency} ${order.total.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
              
              <div class="download-section">
                <h3>📥 Download Your Products</h3>
                <p>Your digital products are ready for download. Click the button below to access your purchases.</p>
                <a href="${orderUrl}" class="cta-button">View Order & Download</a>
              </div>
              
              <p><strong>What's Next?</strong></p>
              <ul>
                <li>You can download your products from your order page</li>
                <li>Keep this email as your receipt</li>
                <li>Contact us if you have any questions</li>
                <li>Enjoy your new products!</li>
              </ul>
              
              <p>Thank you for choosing JobZee!</p>
              
              <p>Best regards,<br>
              The JobZee Team</p>
            </div>
            
            <div class="footer">
              <p>This is your official order confirmation. Please keep this email safe.</p>
              <p>If you have any questions, contact us at support@jobzee.com</p>
              <p>&copy; 2024 JobZee. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Order Confirmation - ${order.orderNumber}
        
        Hello ${customerName}!
        
        Thank you for your purchase! Your order has been confirmed and is being processed.
        
        ORDER INFORMATION:
        - Order Number: ${order.orderNumber}
        - Order Date: ${new Date(order.createdAt).toLocaleDateString()}
        - Total Amount: ${order.currency} ${order.total.toFixed(2)}
        - Payment Status: Paid
        - Order Status: ${order.status}
        
        ITEMS PURCHASED:
        ${order.items.map(item => `
        - ${item.productSnapshot?.name || 'Product'} (${item.productSnapshot?.category || ''})
          Quantity: ${item.quantity}
          Unit Price: ${order.currency} ${item.unitPrice.toFixed(2)}
          Total: ${order.currency} ${item.totalPrice.toFixed(2)}
        `).join('')}
        
        TOTAL: ${order.currency} ${order.total.toFixed(2)}
        
        DOWNLOAD YOUR PRODUCTS:
        View your order and download your products: ${orderUrl}
        
        WHAT'S NEXT:
        - You can download your products from your order page
        - Keep this email as your receipt
        - Contact us if you have any questions
        - Enjoy your new products!
        
        Thank you for choosing JobZee!
        
        Best regards,
        The JobZee Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw new Error('Failed to send order confirmation email');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendTicketEmail,
  sendOrderConfirmationEmail,
  testEmailConnection,
  sendMentorApplicationStatusEmail,
  sendSessionInvoiceEmail
};
