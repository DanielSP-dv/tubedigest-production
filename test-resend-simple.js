const { Resend } = require('resend');

const log = (message, type = 'INFO') => {
  const emoji = {
    'INFO': 'ℹ️',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARNING': '⚠️'
  }[type] || 'ℹ️';
  
  console.log(`${emoji} ${message}`);
};

const testResendSetup = async () => {
  log('Resend Email Service Setup Test', 'INFO');
  log('================================', 'INFO');

  // Check if Resend API key is configured
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    log('RESEND_API_KEY not found in environment variables', 'ERROR');
    log('', 'INFO');
    log('To set up Resend:', 'INFO');
    log('1. Go to https://resend.com and create an account', 'INFO');
    log('2. Get your API key from https://resend.com/api-keys', 'INFO');
    log('3. Add to your .env file: RESEND_API_KEY=re_your_key_here', 'INFO');
    log('4. Restart your application', 'INFO');
    log('', 'INFO');
    log('See RESEND_EMAIL_SETUP.md for detailed instructions', 'INFO');
    return;
  }

  if (!apiKey.startsWith('re_')) {
    log('Invalid Resend API key format. Should start with "re_"', 'ERROR');
    return;
  }

  log('Resend API key found and format is valid', 'SUCCESS');

  // Test Resend API directly
  try {
    log('Testing Resend API connection...', 'INFO');
    
    const resend = new Resend(apiKey);
    
    const { data, error } = await resend.emails.send({
      from: 'test@resend.dev',
      to: ['danielsecopro@gmail.com'],
      subject: 'TubeDigest - Resend Integration Test',
      html: `
        <h1>🎉 Resend Integration Successful!</h1>
        <p>This email confirms that your TubeDigest application is now using Resend for email delivery.</p>
        <p><strong>Benefits:</strong></p>
        <ul>
          <li>✅ 3,000 free emails per month</li>
          <li>✅ 99.9% uptime SLA</li>
          <li>✅ No more Mailtrap limits</li>
          <li>✅ Professional email delivery</li>
        </ul>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
    });

    if (error) {
      log(`Resend API error: ${error.message}`, 'ERROR');
      return;
    }

    log('Resend API test successful!', 'SUCCESS');
    log(`Email ID: ${data.id}`, 'INFO');
    log('Check your email inbox for the test message', 'SUCCESS');

  } catch (error) {
    log(`Resend API test failed: ${error.message}`, 'ERROR');
    
    if (error.message.includes('Unauthorized')) {
      log('→ Invalid API key. Please check your RESEND_API_KEY', 'WARNING');
    } else if (error.message.includes('rate limit')) {
      log('→ Rate limit exceeded. Free tier: 100 emails/day', 'WARNING');
    }
  }
};

const showSetupInstructions = () => {
  log('', 'INFO');
  log('📧 Resend Email Service - Quick Setup', 'INFO');
  log('=====================================', 'INFO');
  log('', 'INFO');
  log('1. 🚀 Create Resend Account', 'INFO');
  log('   → Go to https://resend.com', 'INFO');
  log('   → Click "Get Started" and sign up', 'INFO');
  log('', 'INFO');
  log('2. 🔑 Get API Key', 'INFO');
  log('   → Go to https://resend.com/api-keys', 'INFO');
  log('   → Click "Create API Key"', 'INFO');
  log('   → Copy the key (starts with "re_")', 'INFO');
  log('', 'INFO');
  log('3. ⚙️ Configure Environment', 'INFO');
  log('   → Copy env-template.txt to .env', 'INFO');
  log('   → Replace "your-resend-api-key-here" with your actual key', 'INFO');
  log('', 'INFO');
  log('4. 🧪 Test Integration', 'INFO');
  log('   → Run: node test-resend-simple.js', 'INFO');
  log('   → Check your email for test message', 'INFO');
  log('', 'INFO');
  log('📊 Free Tier Benefits:', 'INFO');
  log('   → 3,000 emails per month', 'INFO');
  log('   → 100 emails per day', 'INFO');
  log('   → No credit card required', 'INFO');
  log('   → 99.9% uptime SLA', 'INFO');
  log('', 'INFO');
  log('📖 For detailed instructions, see: RESEND_EMAIL_SETUP.md', 'INFO');
};

// Run the test
testResendSetup().then(() => {
  showSetupInstructions();
}).catch(error => {
  log(`Test failed: ${error.message}`, 'ERROR');
});
