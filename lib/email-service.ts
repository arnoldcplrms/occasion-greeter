import nodemailer from 'nodemailer';
import {
  type PhotoLookupResult,
  normalizeManifestPhotoUrl,
  type OccasionManifest,
  resolveOccasionPhoto,
} from './drive-photo-service';
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

function toDriveViewUrl(url: string): string {
  return normalizeManifestPhotoUrl(url);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function inferImageExtension(url: string): string {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.png')) return 'png';
  if (cleanUrl.endsWith('.gif')) return 'gif';
  if (cleanUrl.endsWith('.webp')) return 'webp';
  return 'jpg';
}

interface OccasionEmailMeta {
  subject: string;
  fallbackProfilePicture: string;
}

interface ResolvedPhotoState {
  profilePictureUrl: string;
  missingPhotoHint: string;
}

function getOccasionEmailMeta(occasion: Occasion): OccasionEmailMeta {
  if (occasion.type === 'birthday' && occasion.person) {
    return {
      subject: `Birthday Greeting: ${occasion.person.name}`,
      fallbackProfilePicture: occasion.person.profilePicture,
    };
  }

  if (occasion.type === 'anniversary' && occasion.couple) {
    return {
      subject: `Anniversary Greeting: Team ${occasion.couple.lastName}`,
      fallbackProfilePicture: occasion.couple.profilePicture,
    };
  }

  throw new Error('Invalid occasion type');
}

function buildMediaSectionHtml(
  hasImageAttachment: boolean,
  viewUrl: string,
  safeMissingPhotoHint: string
): string {
  if (hasImageAttachment) {
    return `<div class="section"><img class="profile-img" src="${viewUrl}" alt="Profile Picture" /><p class="hint">The profile image is attached to this email for download.</p></div>`;
  }

  if (safeMissingPhotoHint) {
    return `<div class="section"><p class="hint">${safeMissingPhotoHint}</p></div>`;
  }

  return '';
}

function resolvePhotoState(
  occasion: Occasion,
  lookupResult: PhotoLookupResult,
  fallbackProfilePicture: string
): ResolvedPhotoState {
  if (lookupResult.status === 'found') {
    return {
      profilePictureUrl: lookupResult.url,
      missingPhotoHint: '',
    };
  }

  if (lookupResult.status === 'not-configured' && fallbackProfilePicture) {
    return {
      profilePictureUrl: toDriveViewUrl(fallbackProfilePicture),
      missingPhotoHint: '',
    };
  }

  if (lookupResult.attemptedFileName) {
    console.warn(
      `Photo not found for ${occasion.type}: ${lookupResult.attemptedFileName}`
    );
  }

  return {
    profilePictureUrl: '',
    missingPhotoHint:
      lookupResult.message || 'No celebrant photo available for this occasion.',
  };
}

/**
 * Generate HTML email content with greeting and inline profile picture
 */
function generateEmailHTML(
  greeting: string,
  profilePictureUrl: string,
  hasImageAttachment: boolean,
  missingPhotoHint?: string
): string {
  const viewUrl = escapeHtml(profilePictureUrl);
  const safeGreeting = escapeHtml(greeting);
  const safeMissingPhotoHint = missingPhotoHint
    ? escapeHtml(missingPhotoHint)
    : '';
  const mediaSectionHtml = buildMediaSectionHtml(
    hasImageAttachment,
    viewUrl,
    safeMissingPhotoHint
  );

  return `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
      .container { background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 30px; max-width: 600px; margin: 0 auto; }
      .greeting { font-size: 18px; line-height: 1.6; color: #333; white-space: pre-wrap; word-wrap: break-word; padding: 16px; background: #f9f9f9; border-radius: 6px; }
      .section { margin: 24px 0; }
      .profile-img { max-width: 100%; border-radius: 8px; display: block; margin-bottom: 8px; }
      .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
      .hint { font-size: 12px; color: #666; margin-top: 4px; }
    </style>
  </head>
  <body>
    <div class="container">

      <div class="section">
        <div class="greeting" id="greetingText">${safeGreeting}</div>
      </div>

      ${mediaSectionHtml}

      <div class="footer">
        <p>Sent by Birthday &amp; Anniversary Greeter 🎉</p>
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Send an occasion greeting email (birthday or anniversary)
 * @param occasion Occasion data
 * @param greeting Generated greeting message
 * @returns Result of email send operation
 */
export async function sendOccasionEmail(
  occasion: Occasion,
  greeting: string,
  manifest: OccasionManifest
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    validateEmailConfig();

    const { subject, fallbackProfilePicture } = getOccasionEmailMeta(occasion);

    const lookupResult = await resolveOccasionPhoto(occasion, manifest);
    const { profilePictureUrl, missingPhotoHint } = resolvePhotoState(
      occasion,
      lookupResult,
      fallbackProfilePicture
    );

    const hasImageAttachment = Boolean(profilePictureUrl);
    const htmlContent = generateEmailHTML(
      greeting,
      profilePictureUrl,
      hasImageAttachment,
      missingPhotoHint
    );

    const attachments = hasImageAttachment
      ? [
          {
            filename: `profile-picture.${inferImageExtension(
              profilePictureUrl
            )}`,
            path: profilePictureUrl,
            contentDisposition: 'attachment' as const,
          },
        ]
      : [];

    const mailOptions = {
      from: EMAIL_CONFIG.smtpUser,
      to: EMAIL_CONFIG.recipients.join(','),
      subject,
      html: htmlContent,
      attachments,
    };

    const transporter = createTransporter();
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
