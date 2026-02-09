# Birthday & Anniversary Greeter

A modular birthday and anniversary greeting system that runs on a cron schedule via GitHub Actions. It checks daily for birthdays and anniversaries and sends personalized greeting emails with profile pictures.

## Features

- ⏰ Runs daily at 9 AM Philippine Time via GitHub Actions cron
- 🎂 Sends personalized birthday greeting emails
- 💍 Sends wedding anniversary greeting emails
- 🖼️ Includes profile pictures in emails
- 🎲 Randomly selects from pools of greeting templates
- 📦 Modular, maintainable code structure
- 🦘 Built with Bun for fast execution
- 🔄 Automatically transforms legacy couple data format

## Project Structure

```
occassion-greeter/
├── .github/workflows/
│   └── occassion-greeter.yml      # GitHub Actions workflow with cron schedule
├── lib/
│   ├── types.ts                  # TypeScript type definitions
│   ├── data-loader.ts            # Load and transform occasions data from environment
│   ├── birthday-matcher.ts       # Find birthdays and anniversaries matching today
│   ├── greeting-generator.ts     # Generate random greetings
│   └── email-service.ts          # Send emails via SMTP
├── scripts/
│   └── send-birthday-greetings.ts # Main orchestrator script
├── constants.ts                   # Greeting templates
├── couples.json                   # Couple data (reference, use env var in prod)
├── package.json                   # Dependencies and scripts
└── .env.example                   # Environment variable template
```

## Setup

### 1. Prerequisites

- Node.js/Bun installed locally
- GitHub repository
- SMTP service (Gmail, SendGrid, etc.)

### 2. Environment Variables

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

Update with your values:

```env
COUPLES_DATA='[{"timestamp": "...", "male": {...}, "female": {...}, ...}]'
RECIPIENT_EMAIL=your-email@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Email Server Setup

Choose one of the options below to get your SMTP credentials:

#### **Option A: Gmail (Recommended for Testing)**

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App passwords** (only available if 2FA is enabled)
4. Select **Mail** and **Windows Computer** (or your device)
5. Generate the password - Google will show a 16-character password
6. Copy this password to `SMTP_PASSWORD`

**Gmail SMTP Settings:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<16-character-app-password>
```

#### **Option B: Outlook/Hotmail**

1. Go to [account.microsoft.com/security](https://account.microsoft.com/security)
2. Enable **Advanced security options** if needed
3. For app passwords, go to **Security info** → **Add method** → **App password**
4. Get your app password

**Outlook SMTP Settings:**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=<app-password>
```

#### **Option C: SendGrid (Best for Production)**

1. Go to [sendgrid.com](https://sendgrid.com) and create an account
2. Verify your sender email (or add as single sender)
3. Go to **Settings** → **API Keys**
4. Create a new API key with "Mail Send" permissions
5. Copy the API key

**SendGrid SMTP Settings:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
```

#### **Option D: Other Providers**

| Provider          | SMTP Host                         | Port       | Username                    | Password                     |
| ----------------- | --------------------------------- | ---------- | --------------------------- | ---------------------------- |
| **Mailgun**       | `smtp.mailgun.org`                | 587        | `postmaster@yourdomain.com` | SMTP password from dashboard |
| **AWS SES**       | `email-smtp.region.amazonaws.com` | 587        | SMTP username from AWS      | SMTP password from AWS       |
| **Custom Server** | Your server hostname              | 587 or 465 | Your email/user             | Your password                |

### 4. GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `COUPLES_DATA` - Entire JSON array as a string
- `RECIPIENT_EMAIL` - Email address to receive greetings
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP port (usually 587 or 465)
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password or app password

**Steps to add secrets:**

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret one by one

### 5. Install Dependencies

```bash
bun install
```

### 6. Test Locally

```bash
bun run dev
```

## Modules

### `lib/types.ts`

Defines TypeScript interfaces for `Person`, `Couple`, and `BirthdayPerson`.

### `lib/data-loader.ts`

- `loadCouplesData()` - Parses `COUPLES_DATA` environment variable

### `lib/birthday-matcher.ts`

- `findOccasionsToday()` - Finds birthdays and anniversaries matching today (PH timezone)
- Checks all three dates: male birthday, female birthday, wedding anniversary
- Handles date parsing in DD/MM/YYYY format

### `lib/greeting-generator.ts`

- `generateGreeting()` - Selects random greeting from appropriate pool
- Uses `<<nickname>>` placeholder for birthdays
- Uses `<<lastName>>` placeholder for anniversaries
- Falls back to first name if no nickname provided

### `lib/email-service.ts`

- `sendOccasionEmail()` - Sends HTML email via SMTP
- Includes profile picture for birthdays
- Includes couple profile picture for anniversaries
- Generates formatted HTML email with images

### `scripts/send-birthday-greetings.ts`

Main orchestrator that:

1. Loads occasions data (birthdays and anniversaries)
2. Finds today's occasions
3. Generates personalized greetings
4. Sends emails

## Data Format

The system supports a flattened occasion data structure:

```json
{
  "maleName": "Arnold",
  "femaleName": "Krizzia Mae",
  "maleNickname": "",
  "femaleNickname": "Cha",
  "maleBirthday": "20/07/1995",
  "femaleBirthday": "23/12/1995",
  "maleProfilePicture": "https://...",
  "femaleProfilePicture": "https://...",
  "coupleLastName": "Ramos",
  "weddingAnniversary": "27/05/2023",
  "weddingProfilePicture": "https://..."
}
```

**Backward Compatible:** The system automatically transforms the legacy couple format (with `male` and `female` nested objects) to this flattened format.

## Cron Schedule

The workflow runs at **9 AM Philippine Time** every day:

```yaml
- cron: '0 1 * * *' # 1 AM UTC = 9 AM PH (UTC+8)
```

To adjust:

- **9 AM PH = 1 AM UTC** (current setting)
- Edit `.github/workflows/occassion-greeter.yml` if needed

## Date Format

All dates in the JSON data must be in **DD/MM/YYYY** format:

- Valid: `"20/07/1995"` (July 20, 1995)
- Invalid: `"07/20/1995"` (will fail)

Empty dates are skipped gracefully and won't trigger greetings.

## Adding/Editing Greetings

Edit the greeting arrays in `constants.ts`:

**Birthday Greetings:**

```typescript
export const BIRTHDAY_GREETINGS = [
  'Happy birthday <<nickname>>! ...',
  'Wishing you the happiest birthday <<nickname>>! ...',
  // Add more greetings with <<nickname>> placeholder
];
```

**Anniversary Greetings:**

```typescript
export const WEDDING_ANNIVERSARY_GREETINGS = [
  'Happy Anniversary Team <<lastName>>! ...',
  // Add more greetings with <<lastName>> placeholder
];
```

Placeholders:

- `<<nickname>>` - Used in birthday greetings, replaced with person's nickname or name
- `<<lastName>>` - Used in anniversary greetings, replaced with couple's last name

## Local Development

```bash
# Install dependencies
bun install

# Run the script locally (with .env file)
bun run dev

# Build for production
bun run build
```

## Troubleshooting

### Email not sending

**Gmail Issues:**

- ✅ Ensure you're using an **App Password** (16 characters), not your regular Gmail password
- ✅ Verify 2-Step Verification is enabled in Google Account settings
- ✅ Check that "Less secure app access" is NOT enabled (use App Passwords instead)
- ✅ Wait 5-10 minutes after generating the app password before using it
- ✅ Try sending a test email manually with the credentials

**Outlook/Hotmail Issues:**

- ✅ Use the app password generated from account.microsoft.com, not your regular password
- ✅ Ensure your email is verified in Microsoft Account settings
- ✅ Check that your Microsoft Account has 2FA enabled

**SendGrid Issues:**

- ✅ Use `apikey` as the `SMTP_USER` (literally the word "apikey")
- ✅ Use your full API key as `SMTP_PASSWORD`
- ✅ Verify you've verified the sender email in SendGrid dashboard
- ✅ Check SendGrid API key has "Mail Send" permissions

**Common SMTP Errors:**

```
Error: connect ECONNREFUSED
  → Check SMTP_HOST and SMTP_PORT are correct
  → Verify no firewall is blocking the connection

Error: 535 5.7.8 Username and Password not accepted
  → Double-check SMTP_USER and SMTP_PASSWORD
  → For Gmail, confirm it's the app password, not regular password
  → For Outlook, ensure 2FA is enabled

Error: 530 5.7.0 Must issue a STARTTLS command
  → Set SMTP_PORT to 587 (not 465)
  → Ensure secure flag is false for port 587

Error: 421 Service not available
  → SMTP server is temporarily down, try again later
  → Check if your IP is rate-limited or blocked
```

**Test Email Locally:**

```bash
# Create a test script to verify credentials
cat > test-email.ts << 'EOF'
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

await transporter.sendMail({
  from: process.env.SMTP_USER,
  to: process.env.RECIPIENT_EMAIL,
  subject: 'Test Email',
  html: '<p>If you see this, SMTP is working!</p>',
});

console.log('✓ Test email sent successfully!');
EOF

# Run the test
bun test-email.ts
```

### No greetings sent

- Verify `RECIPIENT_EMAIL` is valid
- Check firewall/network access to SMTP server
- For Gmail: Enable "Less secure app access" or use app password
- Check email service isn't blocking automated sends

### No greetings sent

- Verify dates are in DD/MM/YYYY format
- Check if today's date matches any birthday/anniversary (day/month only)
- Ensure `COUPLES_DATA` is valid JSON
- Look at GitHub Actions logs for error messages

### GitHub Actions failing

- Check workflow logs in GitHub (Actions tab)
- Verify all required secrets are set
- Ensure `COUPLES_DATA` is properly formatted JSON (not truncated)
- Check file paths in workflow match your setup

### Data transformation issues

- If using legacy format, check it has `male` and `female` properties
- System will log transformation status
- Both formats should work automatically

## Performance

- **Execution time**: ~1-2 seconds (with email sending)
- **Memory**: ~80MB
- **Cost**: Free with GitHub Actions free tier (usually 2000 minutes/month)

## Troubleshooting

### Email not sending

- Check SMTP credentials
- Verify `RECIPIENT_EMAIL` is valid
- Check firewall/network access to SMTP server
- For Gmail: Enable "Less secure app access" or use app password

### No birthdays found

- Verify date format is DD/MM/YYYY
- Check if today's date matches any birthday (day/month only)
- Ensure `COUPLES_DATA` is properly formatted JSON

### GitHub Actions failing

- Check workflow logs in GitHub (Actions tab)
- Verify all required secrets are set
- Ensure `COUPLES_DATA` is valid JSON

## Performance

- **Execution time**: < 1 second typically (with email send)
- **Memory**: ~50MB
- **Cost**: Free with GitHub Actions free tier (usually 2000 minutes/month)
