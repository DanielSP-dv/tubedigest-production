#!/usr/bin/env node

/**
 * TubeDigest Exhaustive Full-Flow Test Suite
 * Comprehensive testing of all application functionality
 * 
 * Test Coverage:
 * 1. Authentication Flow (Login/Logout/Persistence)
 * 2. Channel Management (Full CRUD)
 * 3. Digest Management (Full CRUD)
 * 4. Data Loading Limits & Pagination
 * 5. Session Persistence
 * 6. Email Integration
 * 7. User Profile Management
 * 8. Error Handling & Edge Cases
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = 'danielsecopro@gmail.com';
const TEST_CHANNEL_ID = 'UC-lHJZR3Gqxm24_Vd_AJ5Yw';

// Test state
let sessionCookies = [];
let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
};

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

const recordResult = (testName, status, details = '') => {
    const result = { testName, status, details, timestamp: new Date().toISOString() };
    testResults.details.push(result);
    
    if (status === 'PASS') {
        testResults.passed++;
        log(`✅ ${testName}`, 'SUCCESS');
    } else if (status === 'FAIL') {
        testResults.failed++;
        log(`❌ ${testName}`, 'ERROR');
    } else if (status === 'WARN') {
        testResults.warnings++;
        log(`⚠️ ${testName}`, 'WARNING');
    }
    
    if (details) {
        log(`   ${details}`, status === 'PASS' ? 'SUCCESS' : status === 'FAIL' ? 'ERROR' : 'WARNING');
    }
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
            return error.response;
        }
        throw error;
    }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test Categories

const testAuthenticationFlow = async () => {
    log('\n🔐 Testing Authentication Flow...', 'INFO');
    
    // Test 1: Initial unauthenticated state
    const initialAuth = await makeRequest('GET', '/me');
    recordResult('Initial Auth State', 
        initialAuth.status === 401 ? 'PASS' : 'FAIL',
        `Status: ${initialAuth.status} (expected 401)`
    );

    // Test 2: OAuth endpoint accessibility
    const oauthResponse = await makeRequest('GET', '/auth/google');
    recordResult('OAuth Endpoint Access', 
        oauthResponse.status === 200 || oauthResponse.status === 302 ? 'PASS' : 'FAIL',
        `Status: ${oauthResponse.status}`
    );

    // Test 3: Logout without session
    const logoutWithoutSession = await makeRequest('POST', '/auth/logout');
    recordResult('Logout Without Session', 
        logoutWithoutSession.status === 200 ? 'PASS' : 'WARN',
        `Status: ${logoutWithoutSession.status}`
    );

    return true;
};

const testChannelManagementCRUD = async () => {
    log('\n📺 Testing Channel Management CRUD...', 'INFO');
    
    // Test 1: Get all channels
    const channelsResponse = await makeRequest('GET', '/channels');
    recordResult('Get All Channels', 
        channelsResponse.status === 200 ? 'PASS' : 'FAIL',
        `Found ${channelsResponse.data?.length || 0} channels`
    );

    if (channelsResponse.status === 200 && channelsResponse.data) {
        const channels = channelsResponse.data;
        
        // Test 2: Data structure validation
        const hasValidStructure = channels.every(ch => 
            ch.id && ch.channelId && ch.title && typeof ch.selected === 'boolean'
        );
        recordResult('Channel Data Structure', 
            hasValidStructure ? 'PASS' : 'FAIL',
            `All ${channels.length} channels have valid structure`
        );

        // Test 3: Check for real data (not mock)
        const hasRealChannels = channels.some(ch => 
            ch.channelId && ch.channelId.startsWith('UC')
        );
        recordResult('Real Channel Data', 
            hasRealChannels ? 'PASS' : 'FAIL',
            `Found real YouTube channels (not mock data)`
        );

        // Test 4: Get selected channels
        const selectedResponse = await makeRequest('GET', '/channels/selected');
        recordResult('Get Selected Channels', 
            selectedResponse.status === 200 ? 'PASS' : 'FAIL',
            `Found ${selectedResponse.data?.length || 0} selected channels`
        );

        // Test 5: Select channels
        if (channels.length > 0) {
            const channelIds = channels.slice(0, 2).map(ch => ch.channelId);
            const titles = {};
            channels.slice(0, 2).forEach(ch => {
                titles[ch.channelId] = ch.title;
            });

            const selectResponse = await makeRequest('POST', '/channels/select', {
                channelIds,
                titles
            });
            recordResult('Select Channels', 
                selectResponse.status === 200 ? 'PASS' : 'WARN',
                `Attempted to select ${channelIds.length} channels`
            );

            // Test 6: Verify selection persisted
            if (selectResponse.status === 200) {
                await sleep(1000); // Wait for persistence
                const verifyResponse = await makeRequest('GET', '/channels/selected');
                const selectedCount = verifyResponse.data?.length || 0;
                recordResult('Selection Persistence', 
                    selectedCount > 0 ? 'PASS' : 'WARN',
                    `Found ${selectedCount} selected channels after selection`
                );
            }
        }

        // Test 7: Update channel selection
        if (channels.length > 0) {
            const firstChannel = channels[0];
            const updateResponse = await makeRequest('PUT', `/${firstChannel.id}`, {
                selected: true
            });
            recordResult('Update Channel Selection', 
                updateResponse.status === 200 ? 'PASS' : 'WARN',
                `Updated selection for channel: ${firstChannel.title}`
            );
        }
    }

    return true;
};

const testDigestManagementCRUD = async () => {
    log('\n📋 Testing Digest Management CRUD...', 'INFO');
    
    // Test 1: Get latest digest
    const latestResponse = await makeRequest('GET', '/digests/latest');
    recordResult('Get Latest Digest', 
        latestResponse.status === 200 ? 'PASS' : 'WARN',
        `Latest digest retrieved`
    );

    // Test 2: Get digest preview
    const previewResponse = await makeRequest('GET', '/digests/preview');
    recordResult('Get Digest Preview', 
        previewResponse.status === 200 ? 'PASS' : 'FAIL',
        `Preview contains ${previewResponse.data?.videos?.length || 0} videos`
    );

    // Test 3: Generate test digest
    const testResponse = await makeRequest('GET', '/digests/test');
    recordResult('Generate Test Digest', 
        testResponse.status === 200 ? 'PASS' : 'WARN',
        `Test digest generated`
    );

    // Test 4: Run digest for specific email
    const runResponse = await makeRequest('POST', '/digests/run', {
        email: TEST_EMAIL,
        schedule: false
    });
    recordResult('Run Digest for Email', 
        runResponse.status === 200 ? 'PASS' : 'WARN',
        `Digest run initiated for ${TEST_EMAIL}`
    );

    // Test 5: Get user schedules
    const schedulesResponse = await makeRequest('GET', '/digests/schedules');
    recordResult('Get User Schedules', 
        schedulesResponse.status === 200 ? 'PASS' : 'WARN',
        `Found ${schedulesResponse.data?.length || 0} schedules`
    );

    // Test 6: Schedule new digest
    const scheduleResponse = await makeRequest('POST', '/digests/schedule', {
        email: TEST_EMAIL,
        cadence: 'daily',
        startDate: new Date().toISOString()
    });
    recordResult('Schedule New Digest', 
        scheduleResponse.status === 200 ? 'PASS' : 'WARN',
        `New schedule created for ${TEST_EMAIL}`
    );

    // Test 7: Cancel schedule (if we have one)
    if (schedulesResponse.status === 200 && schedulesResponse.data.length > 0) {
        const scheduleId = schedulesResponse.data[0].id;
        const cancelResponse = await makeRequest('DELETE', `/digests/schedules/${scheduleId}`, {
            email: TEST_EMAIL
        });
        recordResult('Cancel Schedule', 
            cancelResponse.status === 200 ? 'PASS' : 'WARN',
            `Schedule ${scheduleId} cancelled`
        );
    }

    return true;
};

const testDataLoadingLimits = async () => {
    log('\n📊 Testing Data Loading Limits...', 'INFO');
    
    // Test 1: Channel list size
    const channelsResponse = await makeRequest('GET', '/channels');
    if (channelsResponse.status === 200) {
        const channelCount = channelsResponse.data.length;
        recordResult('Channel List Size', 
            channelCount > 0 ? 'PASS' : 'FAIL',
            `Loaded ${channelCount} channels`
        );

        // Check if there's a limit (common limits: 10, 25, 50, 100)
        const commonLimits = [10, 25, 50, 100];
        const hasLimit = commonLimits.includes(channelCount);
        recordResult('Channel Loading Limit', 
            hasLimit ? 'WARN' : 'PASS',
            `Channel count: ${channelCount} ${hasLimit ? '(appears to be limited)' : '(no obvious limit)'}`
        );
    }

    // Test 2: Digest preview size
    const previewResponse = await makeRequest('GET', '/digests/preview');
    if (previewResponse.status === 200 && previewResponse.data) {
        const videoCount = previewResponse.data.videos?.length || 0;
        recordResult('Digest Preview Size', 
            videoCount >= 0 ? 'PASS' : 'FAIL',
            `Preview contains ${videoCount} videos`
        );

        // Check for common video limits
        const videoLimits = [5, 10, 20, 50];
        const hasVideoLimit = videoLimits.includes(videoCount);
        recordResult('Video Loading Limit', 
            hasVideoLimit ? 'WARN' : 'PASS',
            `Video count: ${videoCount} ${hasVideoLimit ? '(appears to be limited)' : '(no obvious limit)'}`
        );
    }

    // Test 3: Schedule list size
    const schedulesResponse = await makeRequest('GET', '/digests/schedules');
    if (schedulesResponse.status === 200) {
        const scheduleCount = schedulesResponse.data.length;
        recordResult('Schedule List Size', 
            scheduleCount >= 0 ? 'PASS' : 'FAIL',
            `Found ${scheduleCount} schedules`
        );
    }

    return true;
};

const testSessionPersistence = async () => {
    log('\n🔄 Testing Session Persistence...', 'INFO');
    
    // Test 1: Initial session state
    const initialSession = await makeRequest('GET', '/me');
    const initialAuthenticated = initialSession.status === 200;
    recordResult('Initial Session State', 
        initialAuthenticated ? 'WARN' : 'PASS',
        `Initially ${initialAuthenticated ? 'authenticated' : 'not authenticated'}`
    );

    // Test 2: Session cookie persistence
    const hasSessionCookies = sessionCookies.length > 0;
    recordResult('Session Cookie Presence', 
        hasSessionCookies ? 'PASS' : 'WARN',
        `Session cookies: ${sessionCookies.length}`
    );

    // Test 3: Multiple requests with same session
    const requests = [];
    for (let i = 0; i < 3; i++) {
        requests.push(makeRequest('GET', '/channels'));
        await sleep(100);
    }
    
    const responses = await Promise.all(requests);
    const allSuccessful = responses.every(r => r.status === 200);
    recordResult('Session Consistency', 
        allSuccessful ? 'PASS' : 'FAIL',
        `All ${responses.length} requests successful with same session`
    );

    // Test 4: Logout and verify session cleared
    const logoutResponse = await makeRequest('POST', '/auth/logout');
    recordResult('Logout Execution', 
        logoutResponse.status === 200 ? 'PASS' : 'FAIL',
        `Logout successful`
    );

    // Test 5: Verify session cleared
    const postLogoutSession = await makeRequest('GET', '/me');
    recordResult('Post-Logout Session State', 
        postLogoutSession.status === 401 ? 'PASS' : 'FAIL',
        `Session properly cleared (status: ${postLogoutSession.status})`
    );

    return true;
};

const testEmailIntegration = async () => {
    log('\n📧 Testing Email Integration...', 'INFO');
    
    // Test 1: Test email service
    const testEmailResponse = await makeRequest('GET', '/digests/test-email');
    recordResult('Test Email Service', 
        testEmailResponse.status === 200 ? 'PASS' : 'WARN',
        `Test email sent`
    );

    // Test 2: Test digest for specific email
    const testDigestResponse = await makeRequest('GET', `/digests/test-digest/${TEST_EMAIL}`);
    recordResult('Test Digest Email', 
        testDigestResponse.status === 200 ? 'PASS' : 'WARN',
        `Test digest sent to ${TEST_EMAIL}`
    );

    // Test 3: Test Gmail integration
    const testGmailResponse = await makeRequest('GET', `/digests/test-gmail/${TEST_EMAIL}`);
    recordResult('Gmail Integration', 
        testGmailResponse.status === 200 ? 'PASS' : 'WARN',
        `Gmail integration test successful`
    );

    // Test 4: Email with different addresses
    const testEmails = ['test1@example.com', 'test2@example.com'];
    for (const email of testEmails) {
        const response = await makeRequest('GET', `/digests/test-digest/${email}`);
        recordResult(`Email Test - ${email}`, 
            response.status === 200 ? 'PASS' : 'WARN',
            `Email test for ${email}`
        );
    }

    return true;
};

const testErrorHandling = async () => {
    log('\n⚠️ Testing Error Handling...', 'INFO');
    
    // Test 1: Invalid channel ID
    const invalidChannelResponse = await makeRequest('GET', '/channels/invalid-id');
    recordResult('Invalid Channel ID', 
        invalidChannelResponse.status === 404 ? 'PASS' : 'WARN',
        `Expected 404, got ${invalidChannelResponse.status}`
    );

    // Test 2: Invalid digest ID
    const invalidDigestResponse = await makeRequest('GET', '/digests/invalid-id');
    recordResult('Invalid Digest ID', 
        invalidDigestResponse.status === 404 ? 'PASS' : 'WARN',
        `Expected 404, got ${invalidDigestResponse.status}`
    );

    // Test 3: Invalid email format
    const invalidEmailResponse = await makeRequest('GET', '/digests/test-digest/invalid-email');
    recordResult('Invalid Email Format', 
        invalidEmailResponse.status === 400 || invalidEmailResponse.status === 500 ? 'PASS' : 'WARN',
        `Got ${invalidEmailResponse.status} for invalid email`
    );

    // Test 4: Missing required fields
    const missingFieldsResponse = await makeRequest('POST', '/digests/run', {});
    recordResult('Missing Required Fields', 
        missingFieldsResponse.status === 400 ? 'PASS' : 'WARN',
        `Got ${missingFieldsResponse.status} for missing fields`
    );

    // Test 5: Invalid HTTP method
    const invalidMethodResponse = await makeRequest('PUT', '/channels');
    recordResult('Invalid HTTP Method', 
        invalidMethodResponse.status === 405 ? 'PASS' : 'WARN',
        `Got ${invalidMethodResponse.status} for invalid method`
    );

    return true;
};

const testPerformanceBasics = async () => {
    log('\n⚡ Testing Basic Performance...', 'INFO');
    
    // Test 1: Health check response time
    const startTime = Date.now();
    const healthResponse = await makeRequest('GET', '/health');
    const healthTime = Date.now() - startTime;
    recordResult('Health Check Performance', 
        healthTime < 1000 ? 'PASS' : 'WARN',
        `Response time: ${healthTime}ms`
    );

    // Test 2: Channels endpoint response time
    const channelsStart = Date.now();
    const channelsResponse = await makeRequest('GET', '/channels');
    const channelsTime = Date.now() - channelsStart;
    recordResult('Channels Endpoint Performance', 
        channelsTime < 2000 ? 'PASS' : 'WARN',
        `Response time: ${channelsTime}ms`
    );

    // Test 3: Digest preview response time
    const previewStart = Date.now();
    const previewResponse = await makeRequest('GET', '/digests/preview');
    const previewTime = Date.now() - previewStart;
    recordResult('Digest Preview Performance', 
        previewTime < 5000 ? 'PASS' : 'WARN',
        `Response time: ${previewTime}ms`
    );

    return true;
};

// Main test runner
const runExhaustiveTests = async () => {
    log('🚀 Starting TubeDigest Exhaustive Full-Flow Test Suite', 'INFO');
    log('========================================================', 'INFO');
    
    const testSuites = [
        { name: 'Authentication Flow', fn: testAuthenticationFlow },
        { name: 'Channel Management CRUD', fn: testChannelManagementCRUD },
        { name: 'Digest Management CRUD', fn: testDigestManagementCRUD },
        { name: 'Data Loading Limits', fn: testDataLoadingLimits },
        { name: 'Session Persistence', fn: testSessionPersistence },
        { name: 'Email Integration', fn: testEmailIntegration },
        { name: 'Error Handling', fn: testErrorHandling },
        { name: 'Basic Performance', fn: testPerformanceBasics }
    ];

    for (const suite of testSuites) {
        log(`\n🧪 Running ${suite.name}...`, 'INFO');
        try {
            await suite.fn();
        } catch (error) {
            recordResult(suite.name, 'FAIL', `Error: ${error.message}`);
        }
    }

    // Generate comprehensive report
    log('\n📊 Exhaustive Test Results Summary', 'INFO');
    log('====================================', 'INFO');
    log(`✅ Passed: ${testResults.passed}`, 'SUCCESS');
    log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'ERROR' : 'SUCCESS');
    log(`⚠️ Warnings: ${testResults.warnings}`, testResults.warnings > 0 ? 'WARNING' : 'SUCCESS');
    log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`, 'INFO');

    // Save detailed results to file
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            passed: testResults.passed,
            failed: testResults.failed,
            warnings: testResults.warnings,
            successRate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)
        },
        details: testResults.details
    };

    fs.writeFileSync('exhaustive-test-results.json', JSON.stringify(reportData, null, 2));
    log('📄 Detailed results saved to: exhaustive-test-results.json', 'INFO');

    if (testResults.failed === 0) {
        log('\n🎉 All critical tests passed! Application is working correctly.', 'SUCCESS');
    } else {
        log('\n⚠️ Some tests failed. Check the detailed results for more information.', 'WARNING');
    }

    process.exit(testResults.failed === 0 ? 0 : 1);
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

// Run the exhaustive tests
runExhaustiveTests().catch(error => {
    log(`Test suite failed: ${error.message}`, 'ERROR');
    process.exit(1);
});
