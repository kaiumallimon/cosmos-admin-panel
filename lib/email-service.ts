import nodemailer from 'nodemailer';

// Email configuration - these should be set as environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER;
const FROM_NAME = process.env.FROM_NAME || 'COSMOS Admin';
const ADMIN_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function createTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
      throw new Error('SMTP configuration is incomplete. Please set SMTP_USER and SMTP_PASS environment variables.');
    }

    transporter = nodemailer.createTransport(SMTP_CONFIG);
  }
  return transporter;
}

export async function sendEmail({ to, subject, htmlContent, textContent }: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export function generateWelcomeEmailHTML(userEmail: string, temporaryPassword: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to COSMOS-ITS</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 8px;
                letter-spacing: -0.5px;
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
                color: #374151;
            }
            
            .message {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            
            .credentials-box {
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 24px;
                margin: 30px 0;
                border-left: 4px solid #f97316;
            }
            
            .credentials-box h3 {
                color: #374151;
                font-size: 16px;
                margin-bottom: 16px;
                font-weight: 600;
            }
            
            .credential-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .credential-item:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }
            
            .credential-label {
                font-weight: 500;
                color: #6b7280;
            }
            
            .credential-value {
                font-family: 'Courier New', monospace;
                background-color: white;
                padding: 4px 8px;
                border-radius: 4px;
                color: #1f2937;
                border: 1px solid #d1d5db;
                font-weight: 500;
            }
            
            .warning-box {
                background-color: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }
            
            .warning-icon {
                color: #d97706;
                font-size: 18px;
                margin-top: 2px;
            }
            
            .warning-content {
                color: #92400e;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.2s;
                box-shadow: 0 4px 6px rgba(249, 115, 22, 0.25);
            }
            
            .cta-button:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 8px rgba(249, 115, 22, 0.35);
            }
            
            .footer {
                background-color: #f9fafb;
                padding: 30px;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                border-top: 1px solid #e5e7eb;
            }
            
            .footer a {
                color: #f97316;
                text-decoration: none;
            }
            
            .footer a:hover {
                text-decoration: underline;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    border-radius: 0;
                }
                
                .header, .content, .footer {
                    padding-left: 20px;
                    padding-right: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>COSMOS-ITS</h1>
                <p>Welcome to the Admin Panel</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello ${userName},
                </div>
                
                <div class="message">
                    Your account has been successfully created in the COSMOS-ITS Admin Panel. You can now access the system using the temporary credentials provided below.
                </div>
                
                <div class="credentials-box">
                    <h3>🔐 Your Login Credentials</h3>
                    <div class="credential-item">
                        <span class="credential-label">Email:</span>
                        <span class="credential-value">${userEmail}</span>
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Temporary Password:</span>
                        <span class="credential-value">${temporaryPassword}</span>
                    </div>
                </div>
                
                <div class="warning-box">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-content">
                        <strong>Important Security Notice:</strong> Please change your password immediately after your first login. This temporary password is only for initial access.
                    </div>
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${ADMIN_URL}/login" class="cta-button">
                        Login to Admin Panel
                    </a>
                </div>
                
                <div class="message">
                    If you have any questions or need assistance, please don't hesitate to contact our support team.
                </div>
            </div>
            
            <div class="footer">
                <p>
                    This email was sent from COSMOS-ITS Admin Panel.<br>
                    If you didn't expect this email, please contact <a href="mailto:${FROM_EMAIL}">support</a>.
                </p>
                <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                    © ${new Date().getFullYear()} COSMOS-ITS. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

export function generatePasswordResetEmailHTML(userName: string, resetUrl: string, expirationTime: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - COSMOS-ITS</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f5f5f5;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 8px;
                letter-spacing: -0.5px;
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
                color: #374151;
            }
            
            .message {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            
            .reset-box {
                background-color: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 8px;
                padding: 24px;
                margin: 30px 0;
                text-align: center;
                border-left: 4px solid #f97316;
            }
            
            .reset-box h3 {
                color: #92400e;
                font-size: 16px;
                margin-bottom: 16px;
                font-weight: 600;
            }
            
            .reset-box p {
                color: #92400e;
                font-size: 14px;
                margin-bottom: 20px;
            }
            
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                color: white;
                padding: 16px 40px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                transition: transform 0.2s;
                box-shadow: 0 4px 6px rgba(249, 115, 22, 0.25);
            }
            
            .cta-button:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 8px rgba(249, 115, 22, 0.35);
            }
            
            .security-note {
                background-color: #f3f4f6;
                border-radius: 8px;
                padding: 20px;
                margin: 30px 0;
                color: #4b5563;
                font-size: 14px;
                line-height: 1.6;
            }
            
            .security-note h4 {
                color: #374151;
                margin-bottom: 12px;
                font-size: 15px;
                font-weight: 600;
            }
            
            .footer {
                background-color: #f9fafb;
                padding: 30px;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                border-top: 1px solid #e5e7eb;
            }
            
            .footer a {
                color: #f97316;
                text-decoration: none;
            }
            
            .footer a:hover {
                text-decoration: underline;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    border-radius: 0;
                }
                
                .header, .content, .footer {
                    padding-left: 20px;
                    padding-right: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>COSMOS-ITS</h1>
                <p>Password Reset Request</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello ${userName},
                </div>
                
                <div class="message">
                    We received a request to reset your password for your COSMOS-ITS Admin Panel account. If you didn't make this request, you can safely ignore this email.
                </div>
                
                <div class="reset-box">
                    <h3>🔑 Reset Your Password</h3>
                    <p>Click the button below to create a new password. This link will expire in ${expirationTime} for security reasons.</p>
                    
                    <a href="${resetUrl}" class="cta-button">
                        Reset Password
                    </a>
                </div>
                
                <div class="security-note">
                    <h4>🔒 Security Information</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>This reset link is valid for only ${expirationTime}</li>
                        <li>The link can only be used once</li>
                        <li>If you didn't request this reset, please contact support immediately</li>
                        <li>Never share this link with anyone</li>
                    </ul>
                </div>
                
                <div class="message">
                    If the button above doesn't work, you can copy and paste the following URL into your browser:
                    <br><br>
                    <code style="background: #f3f4f6; padding: 8px; border-radius: 4px; word-break: break-all; font-size: 12px;">${resetUrl}</code>
                </div>
            </div>
            
            <div class="footer">
                <p>
                    This email was sent from COSMOS-ITS Admin Panel.<br>
                    If you have concerns about this email, please contact <a href="mailto:${FROM_EMAIL}">support</a>.
                </p>
                <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                    © ${new Date().getFullYear()} COSMOS-ITS. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}