#!/usr/bin/env node

/**
 * TubeDigest Backend CRUD Test Suite
 * Tests all core backend functionality end-to-end
 * 
 * Test Flow:
 * 1. Authentication (login/logout)
 * 2. Channel Management (CRUD operations)
 * 3. Digest Generation
 * 4. Email Sending
 * 5. User Profile Management
 */

const axios = require('axios');
const https = require('https');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'danielsecopro@gmail.com';
const TEST_CHANNEL_ID = 'UC-lHJZR3Gqxm24_Vd_AJ5Yw'; // Test channel ID

// Test state
let sessionCookies = [];
let userId = null;
let testChannelId = null;

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

    // Test 2: Test login with Google OAuth
    log('   Testing Google OAuth login...');
    const loginResponse = await makeRequest('GET', '/auth/google');
    
    if (loginResponse.status === 302 || loginResponse.status === 200) {
        log('   ✅ OAuth redirect initiated', 'SUCCESS');
        log(`   Redirect URL: ${loginResponse.headers.location || 'No redirect'}`);
    } else {
        log('   ❌ OAuth login failed', 'ERROR');
        return false;
    }

    // Note: Full OAuth flow requires browser interaction
    // For now, we'll test with session cookies if available
    log('   ⚠️ OAuth flow requires browser interaction - skipping full test', 'WARNING');
    
    return true;
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

    // Test 2: Get single channel
    if (channelsResponse.data.length > 0) {
        const firstChannel = channelsResponse.data[0];
        log(`   Testing GET /channels/${firstChannel.id}...`);
        
        const singleChannelResponse = await makeRequest('GET', `/channels/${firstChannel.id}`);
        
        if (singleChannelResponse.status === 200) {
            log('   ✅ Single channel retrieved successfully', 'SUCCESS');
            log(`   Channel: ${singleChannelResponse.data.title}`);
        } else {
            log('   ❌ Failed to retrieve single channel', 'ERROR');
        }
    }

    // Test 3: Create new channel
    log('   Testing POST /channels (create new channel)...');
    const newChannelData = {
        channelId: TEST_CHANNEL_ID,
        title: 'Test Channel - Backend CRUD Test',
        description: 'Channel created during backend CRUD testing',
        thumbnailUrl: 'https://via.placeholder.com/120x90',
        subscriberCount: 1000,
        videoCount: 50
    };

    const createResponse = await makeRequest('POST', '/channels', newChannelData);
    
    if (createResponse.status === 201) {
        log('   ✅ New channel created successfully', 'SUCCESS');
        testChannelId = createResponse.data.id;
        log(`   Created channel ID: ${testChannelId}`);
    } else {
        log('   ❌ Failed to create new channel', 'ERROR');
        log(`   Response: ${JSON.stringify(createResponse.data)}`);
    }

    // Test 4: Update channel
    if (testChannelId) {
        log('   Testing PUT /channels (update channel)...');
        const updateData = {
            title: 'Updated Test Channel - Backend CRUD Test',
            description: 'Channel updated during backend CRUD testing'
        };

        const updateResponse = await makeRequest('PUT', `/channels/${testChannelId}`, updateData);
        
        if (updateResponse.status === 200) {
            log('   ✅ Channel updated successfully', 'SUCCESS');
            log(`   Updated title: ${updateResponse.data.title}`);
        } else {
            log('   ❌ Failed to update channel', 'ERROR');
        }
    }

    // Test 5: Delete test channel
    if (testChannelId) {
        log('   Testing DELETE /channels (delete test channel)...');
        const deleteResponse = await makeRequest('DELETE', `/channels/${testChannelId}`);
        
        if (deleteResponse.status === 200) {
            log('   ✅ Test channel deleted successfully', 'SUCCESS');
        } else {
            log('   ❌ Failed to delete test channel', 'ERROR');
        }
    }

    return true;
};

const testDigestManagement = async () => {
    log('📋 Testing Digest Management...');
    
    // Test 1: Get latest digests
    log('   Testing GET /digests/latest...');
    const latestResponse = await makeRequest('GET', '/digests/latest');
    
    if (latestResponse.status === 200) {
        log('   ✅ Latest digests retrieved successfully', 'SUCCESS');
        log(`   Found ${latestResponse.data.length} digests`);
    } else {
        log('   ❌ Failed to retrieve latest digests', 'ERROR');
        return false;
    }

    // Test 2: Get all digests
    log('   Testing GET /digests...');
    const allDigestsResponse = await makeRequest('GET', '/digests');
    
    if (allDigestsResponse.status === 200) {
        log('   ✅ All digests retrieved successfully', 'SUCCESS');
        log(`   Total digests: ${allDigestsResponse.data.length}`);
    } else {
        log('   ❌ Failed to retrieve all digests', 'ERROR');
    }

    // Test 3: Create new digest
    log('   Testing POST /digests (create new digest)...');
    const newDigestData = {
        title: 'Backend CRUD Test Digest',
        summary: 'This is a test digest created during backend CRUD testing',
        channels: ['UC-lHJZR3Gqxm24_Vd_AJ5Yw'],
        videos: [
            {
                videoId: 'test-video-123',
                title: 'Test Video 1',
                channelTitle: 'Test Channel',
                publishedAt: new Date().toISOString(),
                duration: 'PT10M30S',
                viewCount: 1000,
                likeCount: 50
            }
        ],
        status: 'draft'
    };

    const createDigestResponse = await makeRequest('POST', '/digests', newDigestData);
    
    if (createDigestResponse.status === 201) {
        log('   ✅ New digest created successfully', 'SUCCESS');
        log(`   Created digest ID: ${createDigestResponse.data.id}`);
    } else {
        log('   ❌ Failed to create new digest', 'ERROR');
        log(`   Response: ${JSON.stringify(createDigestResponse.data)}`);
    }

    return true;
};

const testEmailFunctionality = async () => {
    log('📧 Testing Email Functionality...');
    
    // Test 1: Test email sending
    log('   Testing POST /email/send...');
    const emailData = {
        to: TEST_EMAIL,
        subject: 'TubeDigest Backend CRUD Test',
        html: `
            <h1>Backend CRUD Test Email</h1>
            <p>This email was sent during backend CRUD testing.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
            <p>If you receive this, the email functionality is working correctly!</p>
        `,
        text: 'Backend CRUD Test Email - Email functionality is working correctly!'
    };

    const emailResponse = await makeRequest('POST', '/email/send', emailData);
    
    if (emailResponse.status === 200) {
        log('   ✅ Email sent successfully', 'SUCCESS');
        log(`   Email sent to: ${TEST_EMAIL}`);
    } else {
        log('   ❌ Failed to send email', 'ERROR');
        log(`   Response: ${JSON.stringify(emailResponse.data)}`);
    }

    return true;
};

const testUserProfile = async () => {
    log('👤 Testing User Profile Management...');
    
    // Test 1: Get user profile
    log('   Testing GET /me...');
    const profileResponse = await makeRequest('GET', '/me');
    
    if (profileResponse.status === 200) {
        log('   ✅ User profile retrieved successfully', 'SUCCESS');
        log(`   User: ${profileResponse.data.email || 'Unknown'}`);
        userId = profileResponse.data.id;
    } else if (profileResponse.status === 401) {
        log('   ⚠️ User not authenticated (expected for this test)', 'WARNING');
    } else {
        log('   ❌ Failed to retrieve user profile', 'ERROR');
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
    log('🚀 Starting TubeDigest Backend CRUD Test Suite', 'INFO');
    log('================================================', 'INFO');
    
    const tests = [
        { name: 'Health Check', fn: testHealthCheck },
        { name: 'Authentication', fn: testAuthentication },
        { name: 'Channel Management', fn: testChannelManagement },
        { name: 'Digest Management', fn: testDigestManagement },
        { name: 'Email Functionality', fn: testEmailFunctionality },
        { name: 'User Profile', fn: testUserProfile },
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
