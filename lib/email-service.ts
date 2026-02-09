import nodemailer from 'nodemailer';
import type { Occasion } from './types';

/**
 * Email configuration from environment variables
 */
const EMAIL_CONFIG = {
  recipients: (process.env.RECIPIENT_EMAIL || '')
    .split(',')
    .map((e) => e.trim()),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
};

/**
 * Validate email configuration
 */
function validateEmailConfig(): void {
  const requiredFields = ['recipients', 'smtpHost', 'smtpUser', 'smtpPassword'];
  const missing = requiredFields.filter((field) => {
    if (field === 'recipients') {
      return (
        EMAIL_CONFIG.recipients.length === 0 ||
        EMAIL_CONFIG.recipients[0] === ''
      );
    }
    return !EMAIL_CONFIG[field as keyof typeof EMAIL_CONFIG];
  });

  if (missing.length > 0) {
    throw new Error(`Missing email configuration: ${missing.join(', ')}`);
  }
}

/**
 * Create a nodemailer transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: EMAIL_CONFIG.smtpHost,
    port: EMAIL_CONFIG.smtpPort,
    secure: EMAIL_CONFIG.smtpPort === 465,
    auth: {
      user: EMAIL_CONFIG.smtpUser,
      pass: EMAIL_CONFIG.smtpPassword,
    },
  });
}

/**
 * Generate HTML email content with greeting and profile picture URL in text
 */
function generateEmailHTML(
  greeting: string,
  profilePictureUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 30px;
            max-width: 600px;
            margin: 0 auto;
          }
          .greeting {
            font-size: 18px;
            line-height: 1.6;
            color: #333;
            margin-bottom: 20px;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .profile-link {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-left: 4px solid #4285f4;
            border-radius: 4px;
          }
          .profile-link a {
            color: #4285f4;
            text-decoration: none;
            word-break: break-all;
          }
          .profile-link a:hover {
            text-decoration: underline;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #999;
            margin-top: 20px;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="greeting">
            ${greeting}
          </div>
          <div class="profile-link">
            <strong>Profile Picture:</strong><br/>
            <a href="${profilePictureUrl}" target="_blank">${profilePictureUrl}</a>
          </div>
          <div class="footer">
            <p>Sent by Birthday & Anniversary Greeter 🎉</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send an occasion greeting email (birthday or anniversary)
 * @param occasion Occasion data
 * @param greeting Generated greeting message
 * @returns Result of email send operation
 */
export async function sendOccasionEmail(
  occasion: Occasion,
  greeting: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    validateEmailConfig();

    const transporter = createTransporter();

    let subject: string;
    let profilePicture: string;

    if (occasion.type === 'birthday' && occasion.person) {
      subject = `Birthday Greeting: ${occasion.person.name}`;
      profilePicture = occasion.person.profilePicture;
    } else if (occasion.type === 'anniversary' && occasion.couple) {
      subject = `Anniversary Greeting: Team ${occasion.couple.lastName}`;
      profilePicture = occasion.couple.profilePicture;
    } else {
      throw new Error('Invalid occasion type');
    }

    const htmlContent = generateEmailHTML(greeting, profilePicture);

    const mailOptions = {
      from: EMAIL_CONFIG.smtpUser,
      to: EMAIL_CONFIG.recipients.join(','),
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to send email: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
