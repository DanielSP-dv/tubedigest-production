#!/usr/bin/env node

/**
 * Quick Status Check - Verify all services are working
 */

const axios = require('axios');

const log = (message, type = 'INFO') => {
    const color = {
        'INFO': '\x1b[36m',
        'SUCCESS': '\x1b[32m',
        'ERROR': '\x1b[31m',
        'RESET': '\x1b[0m'
    };
    console.log(`${color[type]}${message}${color.RESET}`);
};

const checkServices = async () => {
    log('🔍 Checking TubeDigest Services...', 'INFO');
    log('================================', 'INFO');
    
    // Check Backend Health
    try {
        const backendHealth = await axios.get('http://localhost:3001/health');
        log(`✅ Backend: ${backendHealth.data.status}`, 'SUCCESS');
    } catch (error) {
        log(`❌ Backend: ${error.message}`, 'ERROR');
        return;
    }
    
    // Check Frontend
    try {
        const frontendResponse = await axios.get('http://localhost:3000');
        log('✅ Frontend: Running', 'SUCCESS');
    } catch (error) {
        log(`❌ Frontend: ${error.message}`, 'ERROR');
        return;
    }
    
    // Check Frontend-Backend Proxy
    try {
        const proxyHealth = await axios.get('http://localhost:3000/api/health');
        log('✅ Frontend-Backend Proxy: Working', 'SUCCESS');
    } catch (error) {
        log(`❌ Frontend-Backend Proxy: ${error.message}`, 'ERROR');
        return;
    }
    
    // Test Email Functionality
    try {
        const emailTest = await axios.get('http://localhost:3000/api/digests/test-email');
        if (emailTest.data.status === 'sent') {
            log(`✅ Email System: Working (sent to ${emailTest.data.email})`, 'SUCCESS');
        } else {
            log(`⚠️ Email System: ${emailTest.data.status}`, 'INFO');
        }
    } catch (error) {
        log(`❌ Email System: ${error.message}`, 'ERROR');
    }
    
    log('\n🎉 All Services Are Running!', 'SUCCESS');
    log('Frontend: http://localhost:3000', 'INFO');
    log('Backend: http://localhost:3001', 'INFO');
    log('Ready for testing!', 'INFO');
};

checkServices().catch(error => {
    log(`Status check failed: ${error.message}`, 'ERROR');
    process.exit(1);
});
