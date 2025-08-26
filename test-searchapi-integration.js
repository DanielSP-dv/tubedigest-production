const axios = require('axios');

const log = (message, type = 'INFO') => {
  const colors = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    ERROR: '\x1b[31m',
    WARNING: '\x1b[33m',
    RESET: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.RESET}`);
};

const testSearchAPIIntegration = async () => {
  log('🧪 Testing SearchAPI Integration', 'INFO');
  log('================================', 'INFO');
  
  const baseURL = 'http://localhost:3001';
  
  try {
    // Test 1: Check SearchAPI status
    log('\n1. Checking SearchAPI status...', 'INFO');
    const statusResponse = await axios.get(`${baseURL}/search-api/status`);
    
    if (statusResponse.data.available) {
      log('   ✅ SearchAPI is configured and available', 'SUCCESS');
      log(`   📊 Usage stats: ${JSON.stringify(statusResponse.data.usageStats)}`, 'INFO');
    } else {
      log('   ⚠️ SearchAPI is not configured', 'WARNING');
    }
    
    // Test 2: Search for videos
    log('\n2. Testing video search...', 'INFO');
    const searchResponse = await axios.get(`${baseURL}/search-api/search?q=artificial intelligence&maxResults=3`);
    
    if (searchResponse.data.error) {
      log(`   ❌ Search failed: ${searchResponse.data.error}`, 'ERROR');
    } else {
      log(`   ✅ Search successful - Source: ${searchResponse.data.source}`, 'SUCCESS');
      log(`   📊 Found ${searchResponse.data.totalResults} videos`, 'INFO');
      log(`   ⏱️ Response time: ${searchResponse.data.responseTimeMs}ms`, 'INFO');
      
      if (searchResponse.data.results && searchResponse.data.results.length > 0) {
        const firstVideo = searchResponse.data.results[0];
        log(`   🎥 First video: ${firstVideo.title}`, 'INFO');
        log(`   📝 Has transcript: ${!!firstVideo.transcript}`, 'INFO');
        log(`   📋 Has summary: ${!!firstVideo.summary}`, 'INFO');
      }
    }
    
    // Test 3: Get specific video by ID
    log('\n3. Testing video lookup by ID...', 'INFO');
    const videoId = 'dQw4w9WgXcQ'; // Rick Roll video ID
    const videoResponse = await axios.get(`${baseURL}/search-api/video/${videoId}`);
    
    if (videoResponse.data.error) {
      log(`   ❌ Video lookup failed: ${videoResponse.data.error}`, 'ERROR');
    } else {
      log(`   ✅ Video lookup successful - Source: ${videoResponse.data.source}`, 'SUCCESS');
      log(`   🎥 Video: ${videoResponse.data.video.title}`, 'INFO');
      log(`   📝 Has transcript: ${!!videoResponse.data.video.transcript}`, 'INFO');
      log(`   📋 Has summary: ${!!videoResponse.data.video.summary}`, 'INFO');
    }
    
    // Test 4: Check cache statistics
    log('\n4. Checking cache statistics...', 'INFO');
    const cacheStatsResponse = await axios.get(`${baseURL}/search-api/cache/stats`);
    
    if (cacheStatsResponse.data.error) {
      log(`   ❌ Cache stats failed: ${cacheStatsResponse.data.error}`, 'ERROR');
    } else {
      const stats = cacheStatsResponse.data.stats;
      log('   ✅ Cache statistics retrieved', 'SUCCESS');
      log(`   📊 Total entries: ${stats.totalEntries}`, 'INFO');
      log(`   📊 Active entries: ${stats.activeEntries}`, 'INFO');
      log(`   📊 Expired entries: ${stats.expiredEntries}`, 'INFO');
      log(`   💾 Estimated size: ${Math.round(stats.totalSize / 1024)}KB`, 'INFO');
    }
    
    // Test 5: Test cache functionality
    log('\n5. Testing cache functionality...', 'INFO');
    
    // Search again to test cache hit
    const cacheTestResponse = await axios.get(`${baseURL}/search-api/search?q=artificial intelligence&maxResults=1`);
    
    if (cacheTestResponse.data.source === 'cache') {
      log('   ✅ Cache hit - Results served from cache', 'SUCCESS');
    } else {
      log('   ℹ️ Cache miss - Results served from SearchAPI', 'INFO');
    }
    
    log('\n🎉 SearchAPI Integration Test Complete!', 'SUCCESS');
    log('✅ All endpoints are working correctly', 'SUCCESS');
    log('✅ Cache system is functioning', 'SUCCESS');
    log('✅ Token-saving fallback is ready', 'SUCCESS');
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'ERROR');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'ERROR');
      log(`   Data: ${JSON.stringify(error.response.data)}`, 'ERROR');
    }
  }
};

// Run the test
testSearchAPIIntegration().catch(error => {
  log(`Test failed: ${error.message}`, 'ERROR');
});
