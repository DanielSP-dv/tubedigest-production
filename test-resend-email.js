const axios = require('axios');

const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const emoji = {
    'INFO': 'ℹ️',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'DEBUG': '🔍'
  }[type] || 'ℹ️';
  
  console.log(`${emoji} [${timestamp}] ${message}`);
};

const testResendEmailService = async () => {
  log('Starting Resend Email Service Test', 'INFO');
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
  log('Resend Email Service Test Complete', 'INFO');
  log('Check your email inbox for test messages!', 'SUCCESS');
};

const testResendDirectAPI = async () => {
  log('Testing Resend API directly...', 'INFO');
  
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log('RESEND_API_KEY not found in environment', 'ERROR');
    return;
  }

  try {
    const response = await axios.post('https://api.resend.com/emails', {
      from: 'test@resend.dev',
      to: ['danielsecopro@gmail.com'],
      subject: 'TubeDigest - Resend API Test',
      html: '<h1>Resend API Test</h1><p>This email was sent directly via Resend API to test the integration.</p>'
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    log(`Direct Resend API test successful: ${response.status}`, 'SUCCESS');
    log(`Email ID: ${response.data.id}`, 'INFO');
  } catch (error) {
    log(`Direct Resend API test failed: ${error.response?.data?.message || error.message}`, 'ERROR');
  }
};

const main = async () => {
  log('🚀 TubeDigest Resend Email Integration Test', 'INFO');
  log('==============================================', 'INFO');

  // Test direct Resend API first
  await testResendDirectAPI();
  
  log('', 'INFO');
  
  // Test through our application
  await testResendEmailService();
};

// Run the test
main().catch(error => {
  log(`Test failed with error: ${error.message}`, 'ERROR');
  process.exit(1);
});
