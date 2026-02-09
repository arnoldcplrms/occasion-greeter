import nodemailer from 'nodemailer';

const config = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

console.log('Testing SMTP connection...');
console.log(`SMTP Host: ${config.host}`);
console.log(`SMTP Port: ${config.port}`);
console.log(`SMTP User: ${config.auth.user}`);
console.log(`Password length: ${config.auth.pass?.length} characters`);
console.log('');

const transporter = nodemailer.createTransport(config);

try {
  const verified = await transporter.verify();
  if (verified) {
    console.log('✅ SMTP connection verified successfully!');
  } else {
    console.log('❌ SMTP connection failed verification');
  }
} catch (error) {
  console.log('❌ SMTP connection error:');
  console.log(error instanceof Error ? error.message : String(error));
}
