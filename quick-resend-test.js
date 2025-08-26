const axios = require('axios');

const log = (message, type = 'INFO') => {
  const emoji = {
    'INFO': 'ℹ️',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARNING': '⚠️'
  }[type] || 'ℹ️';
  
  console.log(`${emoji} ${message}`);
};

const testEmailService = async () => {
  log('Testing Email Service Configuration', 'INFO');
  log('====================================', 'INFO');

  // Wait for backend to start
  log('Waiting for backend to start...', 'INFO');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Test 1: Health check
    log('1. Testing backend health...', 'INFO');
    const healthResponse = await axios.get('http://localhost:3001/health');
    log(`   Backend is running: ${healthResponse.status}`, 'SUCCESS');

    // Test 2: Email configuration test
    log('2. Testing email configuration...', 'INFO');
    const emailResponse = await axios.post('http://localhost:3001/digests/test-email');
    log(`   Email test response: ${emailResponse.status}`, 'SUCCESS');
    
    const responseData = emailResponse.data;
    log(`   Email service: ${responseData.email ? 'Configured' : 'Not configured'}`, 'INFO');
    log(`   Status: ${responseData.status}`, responseData.status === 'sent' ? 'SUCCESS' : 'WARNING');
    
    if (responseData.error) {
      log(`   Error: ${responseData.error}`, 'ERROR');
      
      // Check if it's a Resend configuration issue
      if (responseData.error.includes('RESEND_API_KEY')) {
        log('   → Resend API key not configured', 'WARNING');
        log('   → Please follow the setup guide in RESEND_EMAIL_SETUP.md', 'INFO');
      } else if (responseData.error.includes('Mailtrap')) {
        log('   → Mailtrap limit reached, Resend not configured', 'WARNING');
        log('   → Please configure Resend API key', 'INFO');
      }
    } else if (responseData.messageId) {
      log(`   Message ID: ${responseData.messageId}`, 'SUCCESS');
      log('   → Email sent successfully!', 'SUCCESS');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('Backend is not running. Please start it with: npm run start:dev', 'ERROR');
    } else {
      log(`Test failed: ${error.message}`, 'ERROR');
    }
  }
};

testEmailService();
