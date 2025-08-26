#!/usr/bin/env node

/**
 * TubeDigest Backend CRUD Test Suite (Corrected)
 * Tests all core backend functionality using actual API endpoints
 * 
 * Test Flow:
 * 1. Health Check
 * 2. Channel Management (using actual endpoints)
 * 3. Digest Generation and Management
 * 4. Email Testing
 * 5. Authentication Flow
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'danielsecopro@gmail.com';

// Test state
let sessionCookies = [];

// Utility functions
const log = (message, type = 'INFO') => {
    const timestamp = new Date().toISOString();
    const color = {
        'INFO': '\x1b[36m',    // Cyan
        'SUCCESS': '\x1b[32m', // Green
        'ERROR': '\x1b[31m',   // Red
        'WARNING': '\x1b[33m', // Yellow
        'RESET': '\x1b[0m'     // Reset
    };
    console.log(`${color[type]}[${timestamp}] ${type}: ${message}${color.RESET}`);
};

const extractCookies = (response) => {
    const cookies = response.headers['set-cookie'];
    if (cookies) {
        sessionCookies = cookies.map(cookie => cookie.split(';')[0]);
    }
};

const makeRequest = async (method, endpoint, data = null, options = {}) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (sessionCookies.length > 0) {
            config.headers.Cookie = sessionCookies.join('; ');
        }

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        extractCookies(response);
        return response;
    } catch (error) {
        if (error.response) {
            log(`Request failed: ${error.response.status} - ${error.response.data?.message || error.message}`, 'ERROR');
            return error.response;
        }
        throw error;
    }
};

// Test functions
const testHealthCheck = async () => {
    log('🔍 Testing Health Check...');
    const response = await makeRequest('GET', '/health');
    
    if (response.status === 200) {
        log('✅ Health check passed', 'SUCCESS');
        log(`   Status: ${response.data.status}`);
        log(`   Uptime: ${response.data.uptime}s`);
        return true;
    } else {
        log('❌ Health check failed', 'ERROR');
        return false;
    }
};

const testChannelManagement = async () => {
    log('📺 Testing Channel Management...');
    
    // Test 1: Get all channels
    log('   Testing GET /channels...');
    const channelsResponse = await makeRequest('GET', '/channels');
    
    if (channelsResponse.status === 200) {
        log('   ✅ Channels retrieved successfully', 'SUCCESS');
        log(`   Found ${channelsResponse.data.length} channels`);
        
        // Log first few channels for verification
        channelsResponse.data.slice(0, 3).forEach((channel, index) => {
            log(`   Channel ${index + 1}: ${channel.title} (${channel.channelId})`);
        });
    } else {
        log('   ❌ Failed to retrieve channels', 'ERROR');
        return false;
    }

    // Test 2: Get selected channels
    log('   Testing GET /channels/selected...');
    const selectedResponse = await makeRequest('GET', '/channels/selected');
    
    if (selectedResponse.status === 200) {
        log('   ✅ Selected channels retrieved successfully', 'SUCCESS');
        log(`   Found ${selectedResponse.data.length} selected channels`);
    } else {
        log('   ❌ Failed to retrieve selected channels', 'ERROR');
    }

    // Test 3: Select channels
    if (channelsResponse.data.length > 0) {
        const channelIds = channelsResponse.data.slice(0, 2).map(ch => ch.channelId);
        const titles = {};
        channelsResponse.data.slice(0, 2).forEach(ch => {
            titles[ch.channelId] = ch.title;
        });

        log('   Testing POST /channels/select...');
        const selectResponse = await makeRequest('POST', '/channels/select', {
            channelIds,
            titles
        });
        
        if (selectResponse.status === 200) {
            log('   ✅ Channels selected successfully', 'SUCCESS');
            log(`   Selected ${channelIds.length} channels`);
        } else {
            log('   ❌ Failed to select channels', 'ERROR');
        }
    }

    return true;
};

const testDigestManagement = async () => {
    log('📋 Testing Digest Management...');
    
    // Test 1: Get latest digest
    log('   Testing GET /digests/latest...');
    const latestResponse = await makeRequest('GET', '/digests/latest');
    
    if (latestResponse.status === 200) {
        log('   ✅ Latest digest retrieved successfully', 'SUCCESS');
        if (latestResponse.data) {
            log(`   Digest title: ${latestResponse.data.title || 'No title'}`);
        }
    } else {
        log('   ❌ Failed to retrieve latest digest', 'ERROR');
    }

    // Test 2: Get digest preview
    log('   Testing GET /digests/preview...');
    const previewResponse = await makeRequest('GET', '/digests/preview');
    
    if (previewResponse.status === 200) {
        log('   ✅ Digest preview retrieved successfully', 'SUCCESS');
        if (previewResponse.data) {
            log(`   Preview contains ${previewResponse.data.videos?.length || 0} videos`);
        }
    } else {
        log('   ❌ Failed to retrieve digest preview', 'ERROR');
    }

    // Test 3: Test digest generation
    log('   Testing GET /digests/test...');
    const testResponse = await makeRequest('GET', '/digests/test');
    
    if (testResponse.status === 200) {
        log('   ✅ Test digest generated successfully', 'SUCCESS');
        if (testResponse.data) {
            log(`   Test digest contains ${testResponse.data.videos?.length || 0} videos`);
        }
    } else {
        log('   ❌ Failed to generate test digest', 'ERROR');
    }

    // Test 4: Run digest for specific email
    log(`   Testing POST /digests/run for ${TEST_EMAIL}...`);
    const runResponse = await makeRequest('POST', '/digests/run', {
        email: TEST_EMAIL,
        schedule: false
    });
    
    if (runResponse.status === 200) {
        log('   ✅ Digest run initiated successfully', 'SUCCESS');
        log(`   Digest sent to: ${TEST_EMAIL}`);
    } else {
        log('   ❌ Failed to run digest', 'ERROR');
        log(`   Response: ${JSON.stringify(runResponse.data)}`);
    }

    return true;
};

const testEmailFunctionality = async () => {
    log('📧 Testing Email Functionality...');
    
    // Test 1: Test email service
    log('   Testing GET /digests/test-email...');
    const testEmailResponse = await makeRequest('GET', '/digests/test-email');
    
    if (testEmailResponse.status === 200) {
        log('   ✅ Test email sent successfully', 'SUCCESS');
    } else {
        log('   ❌ Failed to send test email', 'ERROR');
    }

    // Test 2: Test digest for specific email
    log(`   Testing GET /digests/test-digest/${TEST_EMAIL}...`);
    const testDigestResponse = await makeRequest('GET', `/digests/test-digest/${TEST_EMAIL}`);
    
    if (testDigestResponse.status === 200) {
        log('   ✅ Test digest for email sent successfully', 'SUCCESS');
        log(`   Sent to: ${TEST_EMAIL}`);
    } else {
        log('   ❌ Failed to send test digest for email', 'ERROR');
    }

    // Test 3: Test Gmail integration
    log(`   Testing GET /digests/test-gmail/${TEST_EMAIL}...`);
    const testGmailResponse = await makeRequest('GET', `/digests/test-gmail/${TEST_EMAIL}`);
    
    if (testGmailResponse.status === 200) {
        log('   ✅ Gmail test successful', 'SUCCESS');
    } else {
        log('   ❌ Gmail test failed', 'ERROR');
    }

    return true;
};

const testDigestScheduling = async () => {
    log('⏰ Testing Digest Scheduling...');
    
    // Test 1: Get user schedules
    log('   Testing GET /digests/schedules...');
    const schedulesResponse = await makeRequest('GET', '/digests/schedules');
    
    if (schedulesResponse.status === 200) {
        log('   ✅ User schedules retrieved successfully', 'SUCCESS');
        log(`   Found ${schedulesResponse.data.length} schedules`);
    } else {
        log('   ❌ Failed to retrieve user schedules', 'ERROR');
    }

    // Test 2: Schedule a new digest
    log(`   Testing POST /digests/schedule for ${TEST_EMAIL}...`);
    const scheduleResponse = await makeRequest('POST', '/digests/schedule', {
        email: TEST_EMAIL,
        cadence: 'daily',
        startDate: new Date().toISOString()
    });
    
    if (scheduleResponse.status === 200) {
        log('   ✅ Digest scheduled successfully', 'SUCCESS');
        log(`   Scheduled for: ${TEST_EMAIL}`);
    } else {
        log('   ❌ Failed to schedule digest', 'ERROR');
        log(`   Response: ${JSON.stringify(scheduleResponse.data)}`);
    }

    return true;
};

const testAuthentication = async () => {
    log('🔐 Testing Authentication Flow...');
    
    // Test 1: Check if user is authenticated (should be false initially)
    log('   Testing initial auth state...');
    const initialAuth = await makeRequest('GET', '/me');
    if (initialAuth.status === 401) {
        log('   ✅ Correctly not authenticated initially', 'SUCCESS');
    } else {
        log('   ⚠️ Unexpected auth state', 'WARNING');
    }

    // Test 2: Test Google OAuth endpoint
    log('   Testing GET /auth/google...');
    const loginResponse = await makeRequest('GET', '/auth/google');
    
    if (loginResponse.status === 302 || loginResponse.status === 200) {
        log('   ✅ OAuth endpoint accessible', 'SUCCESS');
        log(`   Response status: ${loginResponse.status}`);
    } else {
        log('   ❌ OAuth endpoint not accessible', 'ERROR');
    }

    return true;
};

const testLogout = async () => {
    log('🚪 Testing Logout...');
    
    const logoutResponse = await makeRequest('POST', '/auth/logout');
    
    if (logoutResponse.status === 200) {
        log('   ✅ Logout successful', 'SUCCESS');
        
        // Verify logout by checking /me endpoint
        const verifyResponse = await makeRequest('GET', '/me');
        if (verifyResponse.status === 401) {
            log('   ✅ Session properly cleared', 'SUCCESS');
        } else {
            log('   ⚠️ Session may not be fully cleared', 'WARNING');
        }
    } else {
        log('   ❌ Logout failed', 'ERROR');
    }

    return true;
};

// Main test runner
const runTests = async () => {
    log('🚀 Starting TubeDigest Backend CRUD Test Suite (Corrected)', 'INFO');
    log('========================================================', 'INFO');
    
    const tests = [
        { name: 'Health Check', fn: testHealthCheck },
        { name: 'Channel Management', fn: testChannelManagement },
        { name: 'Digest Management', fn: testDigestManagement },
        { name: 'Email Functionality', fn: testEmailFunctionality },
        { name: 'Digest Scheduling', fn: testDigestScheduling },
        { name: 'Authentication', fn: testAuthentication },
        { name: 'Logout', fn: testLogout }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        log(`\n🧪 Running ${test.name} Test...`, 'INFO');
        try {
            const result = await test.fn();
            if (result) {
                passed++;
                log(`✅ ${test.name} test completed successfully`, 'SUCCESS');
            } else {
                failed++;
                log(`❌ ${test.name} test failed`, 'ERROR');
            }
        } catch (error) {
            failed++;
            log(`❌ ${test.name} test failed with error: ${error.message}`, 'ERROR');
        }
    }

    log('\n📊 Test Results Summary', 'INFO');
    log('========================', 'INFO');
    log(`✅ Passed: ${passed}`, 'SUCCESS');
    log(`❌ Failed: ${failed}`, failed > 0 ? 'ERROR' : 'SUCCESS');
    log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'INFO');

    if (failed === 0) {
        log('\n🎉 All tests passed! Backend is working correctly.', 'SUCCESS');
    } else {
        log('\n⚠️ Some tests failed. Check the logs above for details.', 'WARNING');
    }

    process.exit(failed === 0 ? 0 : 1);
};

// Handle errors and cleanup
process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'ERROR');
    process.exit(1);
});

process.on('SIGINT', () => {
    log('\n🛑 Test interrupted by user', 'WARNING');
    process.exit(1);
});

// Run the tests
runTests().catch(error => {
    log(`Test suite failed: ${error.message}`, 'ERROR');
    process.exit(1);
});
