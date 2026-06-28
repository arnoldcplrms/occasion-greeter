import { loadOccasionsData } from '../lib/data-loader';
import {
  findOccasionsToday,
  findOccasionsTomorrow,
  findOccasionsThisMonth,
} from '../lib/occasion-matcher';
import {
  generateGreeting,
  generateBulkReminderGreeting,
  generateMonthlySummaryGreeting,
} from '../lib/greeting-generator';
import {
  sendBulkReminderEmail,
  sendOccasionEmail,
  sendMonthlySummaryEmail,
} from '../lib/email-service';
import { getManifest } from '../lib/extract-manifest';

(async () => {
  try {
    console.log('🎉 Starting Birthday & Anniversary Greeter...');

    // Load occasions data
    console.log('📂 Loading occasions data...');
    const occasionsData = await loadOccasionsData();
    console.log(`✓ Loaded ${occasionsData.length} occasions`);

    // Send monthly summary on the 1st of the month
    const now = new Date();
    const phTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
    );
    if (phTime.getDate() === 1) {
      console.log('📅 First day of the month — sending monthly summary...');
      const { occasions, month } = findOccasionsThisMonth(occasionsData);
      const summaryGreeting = generateMonthlySummaryGreeting(occasions, month);
      console.log(`📝 Generated monthly summary for ${month}`);
      const result = await sendMonthlySummaryEmail(summaryGreeting, month);
      if (!result.success) {
        return console.error(
          `✗ Failed to send monthly summary email: ${result.error}`
        );
      }
      console.log(
        `✓ Monthly summary email sent successfully (ID: ${result.messageId})`
      );
      return;
    }

    // Find occasions today and tomorrow
    console.log('🔍 Searching for occasions today and tomorrow...');
    const occasionsToday = findOccasionsToday(occasionsData);
    const occasionsTomorrow = findOccasionsTomorrow(occasionsData);

    if (occasionsToday.length === 0 && occasionsTomorrow.length === 0) {
      console.log('✓ No occasions today or tomorrow');
      return;
    }

    const manifest = await getManifest();

    console.log(`✓ Found ${occasionsToday.length} occasion(s) today`);
    console.log(`✓ Found ${occasionsTomorrow.length} occasion(s) tomorrow`);

    // Process each occasion
    for (const occasion of occasionsToday) {
      const logMessage =
        occasion.type === 'birthday' && occasion.person
          ? `🎂 Processing birthday for ${occasion.person.name}`
          : occasion.type === 'anniversary' && occasion.couple
          ? `💍 Processing anniversary for Team ${occasion.couple.lastName}`
          : '';

      console.log(`\n📧 ${logMessage}`);

      // Generate greeting
      const greeting = generateGreeting(occasion);
      console.log(`📝 Generated greeting: ${greeting}`);

      // Send email
      const result = await sendOccasionEmail(occasion, greeting, manifest);

      if (!result.success) {
        return console.error(`✗ Failed to send email: ${result.error}`);
      }

      console.log(`✓ Email sent successfully (ID: ${result.messageId})`);
    }

    // Process reminders for tomorrow
    if (occasionsTomorrow.length > 0) {
      console.log(
        `\n📧 ⏰ Processing combined reminder for ${occasionsTomorrow.length} occasions tomorrow`
      );

      const bulkReminderGreeting =
        generateBulkReminderGreeting(occasionsTomorrow);
      console.log(`📝 Generated combined reminder:\n${bulkReminderGreeting}`);

      const result = await sendBulkReminderEmail(bulkReminderGreeting);

      if (!result.success) {
        return console.error(
          `✗ Failed to send combined reminder email: ${result.error}`
        );
      }

      console.log(
        `✓ Combined reminder email sent successfully (ID: ${result.messageId})`
      );
    }

    console.log('\n✓ Birthday & Anniversary Greeter completed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`✗ Error: ${errorMessage}`);
    process.exit(1);
  }
})();
