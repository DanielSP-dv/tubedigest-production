#!/usr/bin/env node

/**
 * Real Email Test - Tests actual email sending functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'danielsecopro@gmail.com';

const log = (message, type = 'INFO') => {
    const timestamp = new Date().toISOString();
    const color = {
        'INFO': '\x1b[36m',
        'SUCCESS': '\x1b[32m',
        'ERROR': '\x1b[31m',
        'WARNING': '\x1b[33m',
        'RESET': '\x1b[0m'
    };
    console.log(`${color[type]}[${timestamp}] ${type}: ${message}${color.RESET}`);
};

const testRealEmail = async () => {
    log('🧪 Testing Real Email Functionality...', 'INFO');
    
    // Test 1: Check if email service is configured
    log('   Testing email service configuration...', 'INFO');
    try {
        const configResponse = await axios.get(`${BASE_URL}/email/test-config`);
        log(`   Email config status: ${configResponse.data.status}`, 'SUCCESS');
    } catch (error) {
        log(`   Email config test failed: ${error.response?.status || error.message}`, 'ERROR');
    }

    // Test 2: Try to send a real digest (this should actually send an email)
    log('   Testing real digest generation and email sending...', 'INFO');
    try {
        const digestResponse = await axios.post(`${BASE_URL}/digests/run`, {
            email: TEST_EMAIL,
            schedule: false
        });
        
        log(`   Digest run response: ${JSON.stringify(digestResponse.data)}`, 'SUCCESS');
        
        if (digestResponse.data.status === 'sent') {
            log(`   ✅ Real email sent successfully to ${TEST_EMAIL}`, 'SUCCESS');
            log(`   Message ID: ${digestResponse.data.messageId}`, 'SUCCESS');
        } else {
            log(`   ⚠️ Digest run completed but status: ${digestResponse.data.status}`, 'WARNING');
        }
    } catch (error) {
        log(`   Digest run failed: ${error.response?.data?.message || error.message}`, 'ERROR');
    }

    // Test 3: Check backend logs for email activity
    log('   Checking backend logs for email activity...', 'INFO');
    try {
        const logsResponse = await axios.get(`${BASE_URL}/logs/email`);
        log(`   Logs response: ${JSON.stringify(logsResponse.data)}`, 'SUCCESS');
    } catch (error) {
        log(`   Could not retrieve logs: ${error.response?.status || error.message}`, 'WARNING');
    }
};

const testEmailConfiguration = async () => {
    log('\n🔧 Testing Email Configuration...', 'INFO');
    
    // Check environment variables
    log('   Email configuration:', 'INFO');
    log(`   SMTP Host: ${process.env.SMTP_HOST || 'NOT SET'}`, 'INFO');
    log(`   SMTP Port: ${process.env.SMTP_PORT || 'NOT SET'}`, 'INFO');
    log(`   SMTP User: ${process.env.SMTP_USER ? 'SET' : 'NOT SET'}`, 'INFO');
    log(`   SMTP Pass: ${process.env.SMTP_PASS ? 'SET' : 'NOT SET'}`, 'INFO');
    log(`   Gmail User: ${process.env.GMAIL_USER || 'NOT SET'}`, 'INFO');
    log(`   Gmail App Password: ${process.env.GMAIL_APP_PASSWORD ? 'SET' : 'NOT SET'}`, 'INFO');
};

const runRealEmailTest = async () => {
    log('🚀 Starting Real Email Test', 'INFO');
    log('================================', 'INFO');
    
    await testEmailConfiguration();
    await testRealEmail();
    
    log('\n📋 Email Test Summary:', 'INFO');
    log('1. Check your email inbox for danielsecopro@gmail.com', 'INFO');
    log('2. Check spam folder if not in inbox', 'INFO');
    log('3. The email should come from digest@tubedigest.com', 'INFO');
    log('4. If no email received, the email service may not be properly configured', 'WARNING');
};

runRealEmailTest().catch(error => {
    log(`Test failed: ${error.message}`, 'ERROR');
    process.exit(1);
});
