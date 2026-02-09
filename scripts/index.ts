import { loadOccasionsData } from '../lib/data-loader';
import { findOccasionsToday } from '../lib/occasion-matcher';
import { generateGreeting } from '../lib/greeting-generator';
import { sendOccasionEmail } from '../lib/email-service';

/**
 * Main script to send birthday and anniversary greetings
 * Orchestrates the entire workflow:
 * 1. Load occasions data from environment
 * 2. Find birthdays and anniversaries matching today
 * 3. Generate greetings for each occasion
 * 4. Send emails with greetings and profile pictures
 */
async function main(): Promise<void> {
  try {
    console.log('🎉 Starting Birthday & Anniversary Greeter...');

    // Load occasions data
    console.log('📂 Loading occasions data...');
    const occasionsData = loadOccasionsData();
    console.log(`✓ Loaded ${occasionsData.length} occasions`);

    // Find occasions today
    console.log('🔍 Searching for occasions today...');
    const occasionsToday = findOccasionsToday(occasionsData);

    if (occasionsToday.length === 0) {
      console.log('✓ No occasions today');
      return;
    }

    console.log(`✓ Found ${occasionsToday.length} occasion(s) today`);

    // Process each occasion
    for (const occasion of occasionsToday) {
      let logMessage = '';

      if (occasion.type === 'birthday' && occasion.person) {
        logMessage = `🎂 Processing birthday for ${occasion.person.name}`;
      } else if (occasion.type === 'anniversary' && occasion.couple) {
        logMessage = `💍 Processing anniversary for Team ${occasion.couple.lastName}`;
      }

      console.log(`\n📧 ${logMessage}`);

      // Generate greeting
      const greeting = generateGreeting(occasion);
      console.log(`📝 Generated greeting: ${greeting}`);

      // Send email
      const result = await sendOccasionEmail(occasion, greeting);

      if (result.success) {
        console.log(`✓ Email sent successfully (ID: ${result.messageId})`);
      } else {
        console.error(`✗ Failed to send email: ${result.error}`);
      }
    }

    console.log('\n✓ Birthday & Anniversary Greeter completed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`✗ Error: ${errorMessage}`);
    process.exit(1);
  }
}

main();
