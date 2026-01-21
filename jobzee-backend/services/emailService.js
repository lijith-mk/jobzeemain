const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Check if email configuration is available
      const emailConfig = this.getEmailConfig();
      
      if (!emailConfig.host || !emailConfig.user || !emailConfig.pass) {
        console.log('📧 Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in environment variables.');
        return;
      }

      // Create transporter based on configuration
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure, // true for 465, false for other ports
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass,
        },
        tls: {
          rejectUnauthorized: false // For development only
        }
      });

      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
      
      // Verify connection
      this.verifyConnection();
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  getEmailConfig() {
    return {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true' || false,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      appName: process.env.APP_NAME || 'JobZee'
    };
  }

  async verifyConnection() {
    if (!this.transporter) return false;
    
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message);
      return false;
    }
  }

  async sendPasswordResetEmail(employerEmail, resetToken, companyName) {
    if (!this.isConfigured) {
      console.log('📧 Email not configured - would send reset email to:', employerEmail);
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const config = this.getEmailConfig();
      const resetLink = this.generateResetLink(resetToken);
      
      const mailOptions = {
        from: `"${config.appName} Support" <${config.from}>`,
        to: employerEmail,
        subject: `🔐 Password Reset Request - ${config.appName}`,
        html: this.getPasswordResetEmailTemplate(companyName, resetLink, resetToken),
        text: this.getPasswordResetEmailText(companyName, resetLink, resetToken)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully:', result.messageId);
      
      return { 
        success: true, 
        messageId: result.messageId,
        message: 'Password reset email sent successfully'
      };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return { 
        success: false, 
        error: error.message,
        message: 'Failed to send password reset email'
      };
    }
  }

  generateResetLink(resetToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${frontendUrl}/employer/reset-password/${resetToken}`;
  }

  getPasswordResetEmailTemplate(companyName, resetLink, resetToken) {
    const config = this.getEmailConfig();
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - ${config.appName}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f7fa;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
            }
            .header p {
                opacity: 0.9;
                font-size: 16px;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                color: #2c3e50;
            }
            .message {
                margin-bottom: 30px;
                line-height: 1.8;
                color: #555;
            }
            .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                transition: transform 0.3s ease;
            }
            .reset-button:hover {
                transform: translateY(-2px);
            }
            .token-section {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #667eea;
            }
            .token {
                font-family: 'Courier New', monospace;
                font-size: 16px;
                font-weight: 600;
                color: #2c3e50;
                word-break: break-all;
                background: #ffffff;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
            }
            .warning {
                background: #fff3cd;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                border-left: 4px solid #ffc107;
                color: #856404;
            }
            .footer {
                background: #f8f9fa;
                padding: 30px 20px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
            }
            .security-tips {
                margin-top: 30px;
                padding: 20px;
                background: #e8f4fd;
                border-radius: 8px;
                border-left: 4px solid #17a2b8;
            }
            .security-tips h3 {
                color: #0c5460;
                margin-bottom: 10px;
            }
            .security-tips ul {
                color: #0c5460;
                padding-left: 20px;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 8px;
                }
                .content {
                    padding: 20px 15px;
                }
                .header {
                    padding: 20px 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset</h1>
                <p>Secure password reset for ${config.appName}</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello ${companyName ? companyName : 'there'},
                </div>
                
                <div class="message">
                    We received a request to reset the password for your employer account on <strong>${config.appName}</strong>. 
                    If you made this request, please use the button below to reset your password.
                </div>

                <div style="text-align: center;">
                    <a href="${resetLink}" class="reset-button">Reset Your Password</a>
                </div>

                <div class="token-section">
                    <strong>Manual Reset Token:</strong>
                    <p style="margin: 10px 0; font-size: 14px; color: #666;">
                        If the button above doesn't work, you can manually enter this token on the reset page:
                    </p>
                    <div class="token">${resetToken}</div>
                </div>

                <div class="warning">
                    <strong>⏰ Important:</strong> This reset link will expire in <strong>1 hour</strong> for security reasons. 
                    If you don't reset your password within this time, you'll need to request a new reset link.
                </div>

                <div class="security-tips">
                    <h3>🛡️ Security Tips</h3>
                    <ul>
                        <li>Never share your reset token with anyone</li>
                        <li>Use a strong password with at least 8 characters</li>
                        <li>Include uppercase, lowercase, numbers, and special characters</li>
                        <li>Don't use personal information in your password</li>
                    </ul>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
                    <p><strong>Didn't request this reset?</strong></p>
                    <p>If you didn't request a password reset, please ignore this email. Your account remains secure and no changes have been made.</p>
                </div>
            </div>

            <div class="footer">
                <p><strong>${config.appName}</strong> - Your Trusted Job Portal</p>
                <p>This is an automated message, please do not reply to this email.</p>
                <p style="margin-top: 10px; font-size: 12px;">
                    © ${new Date().getFullYear()} ${config.appName}. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  getPasswordResetEmailText(companyName, resetLink, resetToken) {
    const config = this.getEmailConfig();
    
    return `
Password Reset Request - ${config.appName}

Hello ${companyName ? companyName : 'there'},

We received a request to reset the password for your employer account on ${config.appName}.

Reset your password by clicking this link:
${resetLink}

Or manually enter this reset token on the password reset page:
${resetToken}

IMPORTANT: This reset link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your account remains secure.

Security Tips:
- Never share your reset token with anyone
- Use a strong password with at least 8 characters
- Include uppercase, lowercase, numbers, and special characters

---
${config.appName} - Your Trusted Job Portal
This is an automated message, please do not reply.
    `;
  }

  // Test email functionality
  async sendTestEmail(toEmail) {
    if (!this.isConfigured) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const config = this.getEmailConfig();
      
      const mailOptions = {
        from: `"${config.appName} Support" <${config.from}>`,
        to: toEmail,
        subject: `✅ Email Configuration Test - ${config.appName}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">✅ Email Service Working!</h2>
          <p>This is a test email to confirm that your ${config.appName} email service is properly configured.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>Host: ${config.host}</li>
            <li>Port: ${config.port}</li>
            <li>Secure: ${config.secure}</li>
            <li>From: ${config.from}</li>
          </ul>
          <p style="margin-top: 30px; color: #666;">
            <small>This email was sent at ${new Date().toLocaleString()}</small>
          </p>
        </div>
        `,
        text: `Email Service Test - ${config.appName}\n\nThis is a test email to confirm your email service is working.\n\nSent at: ${new Date().toLocaleString()}`
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully:', result.messageId);
      
      return { 
        success: true, 
        messageId: result.messageId,
        message: 'Test email sent successfully'
      };
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      return { 
        success: false, 
        error: error.message,
        message: 'Failed to send test email'
      };
    }
  }
}

// Create and export a singleton instance
const emailService = new EmailService();
module.exports = emailService;
