const axios = require('axios');

const log = (message, type = 'INFO') => {
  const emoji = {
    'INFO': 'ℹ️',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'DEBUG': '🔍'
  }[type] || 'ℹ️';
  
  console.log(`${emoji} ${message}`);
};

const testBrevoEmailService = async () => {
  log('Starting Brevo Email Service Test', 'INFO');
  log('=====================================', 'INFO');

  // Test 1: Check if backend is running
  log('1. Testing backend connectivity...', 'INFO');
  try {
    const healthResponse = await axios.get('http://localhost:3001/health');
    log(`   Backend health: ${healthResponse.status} - ${healthResponse.data.status}`, 'SUCCESS');
  } catch (error) {
    log(`   Backend health check failed: ${error.message}`, 'ERROR');
    return;
  }

  // Test 2: Check email configuration
  log('2. Testing email configuration...', 'INFO');
  try {
    const configResponse = await axios.post('http://localhost:3001/digests/test-email');
    log(`   Email config test: ${configResponse.status}`, 'SUCCESS');
    log(`   Response: ${JSON.stringify(configResponse.data, null, 2)}`, 'DEBUG');
  } catch (error) {
    log(`   Email config test failed: ${error.response?.data?.message || error.message}`, 'ERROR');
  }

  // Test 3: Test digest sending
  log('3. Testing digest sending...', 'INFO');
  try {
    const digestResponse = await axios.post('http://localhost:3001/digests/run', {
      email: 'danielsecopro@gmail.com'
    });
    log(`   Digest send test: ${digestResponse.status}`, 'SUCCESS');
    log(`   Response: ${JSON.stringify(digestResponse.data, null, 2)}`, 'DEBUG');
  } catch (error) {
    log(`   Digest send test failed: ${error.response?.data?.message || error.message}`, 'ERROR');
  }

  // Test 4: Test Gmail-specific email
  log('4. Testing Gmail-specific email...', 'INFO');
  try {
    const gmailResponse = await axios.post('http://localhost:3001/digests/test-gmail/danielsecopro@gmail.com');
    log(`   Gmail test: ${gmailResponse.status}`, 'SUCCESS');
    log(`   Response: ${JSON.stringify(gmailResponse.data, null, 2)}`, 'DEBUG');
  } catch (error) {
    log(`   Gmail test failed: ${error.response?.data?.message || error.message}`, 'ERROR');
  }

  // Test 5: Check environment variables
  log('5. Checking environment configuration...', 'INFO');
  try {
    const envResponse = await axios.get('http://localhost:3001/digests/test-email');
    const responseData = envResponse.data;
    
    log('   Email service configuration:', 'INFO');
    log(`   - Service: ${responseData.email ? 'Configured' : 'Not configured'}`, 'INFO');
    log(`   - Status: ${responseData.status}`, responseData.status === 'sent' ? 'SUCCESS' : 'WARNING');
    log(`   - Message: ${responseData.messageId || responseData.error || 'No message ID'}`, 'INFO');
    
    if (responseData.error) {
      log(`   - Error: ${responseData.error}`, 'ERROR');
    }
  } catch (error) {
    log(`   Environment check failed: ${error.message}`, 'ERROR');
  }

  log('=====================================', 'INFO');
  log('Brevo Email Service Test Complete', 'INFO');
  log('Check your email inbox for test messages!', 'SUCCESS');
};

const testBrevoDirectAPI = async () => {
  log('Testing Brevo API directly...', 'INFO');
  
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    log('BREVO_API_KEY not found in environment', 'ERROR');
    log('', 'INFO');
    log('To set up Brevo:', 'INFO');
    log('1. Go to https://www.brevo.com and create an account', 'INFO');
    log('2. Get your API key from https://app.brevo.com/settings/keys/api', 'INFO');
    log('3. Add to your .env file: BREVO_API_KEY=xkeysib-your-key-here', 'INFO');
    log('4. Restart your application', 'INFO');
    log('', 'INFO');
    log('See BREVO_EMAIL_SETUP.md for detailed instructions', 'INFO');
    return;
  }

  if (!apiKey.startsWith('xkeysib-')) {
    log('Invalid Brevo API key format. Should start with "xkeysib-"', 'ERROR');
    return;
  }

  log('Brevo API key found and format is valid', 'SUCCESS');

  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      to: [{ email: 'danielsecopro@gmail.com' }],
      sender: { email: 'test@brevo.com', name: 'TubeDigest Test' },
      subject: 'TubeDigest - Brevo API Test',
      htmlContent: `
        <h1>🎉 Brevo Integration Successful!</h1>
        <p>This email confirms that your TubeDigest application is now using Brevo for email delivery.</p>
        <p><strong>Benefits:</strong></p>
        <ul>
          <li>✅ 300 emails per day (9,000/month)</li>
          <li>✅ 99.9% uptime SLA</li>
          <li>✅ Advanced analytics and tracking</li>
          <li>✅ Professional email delivery</li>
        </ul>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
    }, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    log('Brevo API test successful!', 'SUCCESS');
    log(`Email ID: ${response.data.messageId}`, 'INFO');
    log('Check your email inbox for the test message', 'SUCCESS');

  } catch (error) {
    log(`Brevo API test failed: ${error.response?.data?.message || error.message}`, 'ERROR');
    
    if (error.response?.data?.message?.includes('Unauthorized')) {
      log('→ Invalid API key. Please check your BREVO_API_KEY', 'WARNING');
    } else if (error.response?.data?.message?.includes('rate limit')) {
      log('→ Rate limit exceeded. Free tier: 300 emails/day', 'WARNING');
    }
  }
};

const showSetupInstructions = () => {
  log('', 'INFO');
  log('📧 Brevo Email Service - Quick Setup', 'INFO');
  log('=====================================', 'INFO');
  log('', 'INFO');
  log('1. 🚀 Create Brevo Account', 'INFO');
  log('   → Go to https://www.brevo.com', 'INFO');
  log('   → Click "Start for free" and sign up', 'INFO');
  log('', 'INFO');
  log('2. 🔑 Get API Key', 'INFO');
  log('   → Go to https://app.brevo.com/settings/keys/api', 'INFO');
  log('   → Click "Create a new API key"', 'INFO');
  log('   → Copy the key (starts with "xkeysib-")', 'INFO');
  log('', 'INFO');
  log('3. ⚙️ Configure Environment', 'INFO');
  log('   → Copy env-template.txt to .env', 'INFO');
  log('   → Replace "your-brevo-api-key-here" with your actual key', 'INFO');
  log('', 'INFO');
  log('4. 🧪 Test Integration', 'INFO');
  log('   → Run: node test-brevo-email.js', 'INFO');
  log('   → Check your email for test message', 'INFO');
  log('', 'INFO');
  log('📊 Free Tier Benefits:', 'INFO');
  log('   → 300 emails per day', 'INFO');
  log('   → 9,000 emails per month', 'INFO');
  log('   → No credit card required', 'INFO');
  log('   → 99.9% uptime SLA', 'INFO');
  log('', 'INFO');
  log('📖 For detailed instructions, see: BREVO_EMAIL_SETUP.md', 'INFO');
};

const main = async () => {
  log('🚀 TubeDigest Brevo Email Integration Test', 'INFO');
  log('==============================================', 'INFO');

  // Test direct Brevo API first
  await testBrevoDirectAPI();
  
  log('', 'INFO');
  
  // Test through our application
  await testBrevoEmailService();
  
  log('', 'INFO');
  showSetupInstructions();
};

// Run the test
main().catch(error => {
  log(`Test failed with error: ${error.message}`, 'ERROR');
  process.exit(1);
});
