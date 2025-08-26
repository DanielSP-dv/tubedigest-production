const axios = require('axios');

async function testSearchAPITranscript() {
  console.log('🎯 Testing SearchAPI Transcript Retrieval and OpenAI Summarization');
  console.log('===============================================================\n');

  try {
    // Test 1: Check SearchAPI status
    console.log('📋 Test 1: Checking SearchAPI Status');
    const statusResponse = await axios.get('http://localhost:3001/search-api/status');
    console.log('✅ SearchAPI Status:', statusResponse.data);
    console.log('');

    // Test 2: Try to get a real video from SearchAPI
    console.log('📋 Test 2: Retrieving Real Video Data from SearchAPI');
    
    // Try with a popular video that should have transcripts
    const testQueries = [
      'Chris Williamson latest video',
      'Mark Manson latest video', 
      'Mike Israetel latest video'
    ];

    let searchResult = null;
    let videoId = null;

    for (const query of testQueries) {
      console.log(`🔍 Trying query: "${query}"`);
      try {
        const searchResponse = await axios.get(`http://localhost:3001/search-api/search`, {
          params: { q: query }
        });
        
        if (searchResponse.data && searchResponse.data.length > 0) {
          searchResult = searchResponse.data[0];
          videoId = searchResult.videoId;
          console.log(`✅ Found video: ${searchResult.title}`);
          console.log(`📺 Video ID: ${videoId}`);
          console.log(`🔗 URL: ${searchResult.link}`);
          console.log(`📊 Views: ${searchResult.views}`);
          console.log(`⏱️ Duration: ${searchResult.length}`);
          console.log(`📅 Published: ${searchResult.published_time}`);
          console.log(`📝 Description: ${searchResult.description?.substring(0, 200)}...`);
          console.log('');
          break;
        }
      } catch (error) {
        console.log(`❌ Query "${query}" failed:`, error.response?.data || error.message);
      }
    }

    if (!searchResult) {
      console.log('❌ Could not find any videos from SearchAPI');
      return;
    }

    // Test 3: Try to get specific video details
    console.log('📋 Test 3: Getting Specific Video Details');
    try {
      const videoResponse = await axios.get(`http://localhost:3001/search-api/video/${videoId}`);
      console.log('✅ Video Details Response:');
      console.log(JSON.stringify(videoResponse.data, null, 2));
      console.log('');
    } catch (error) {
      console.log('❌ Could not get video details:', error.response?.data || error.message);
      console.log('');
    }

    // Test 4: Check if we have any transcript data
    console.log('📋 Test 4: Checking for Transcript Data');
    if (searchResult.description) {
      console.log('✅ Found video description (potential transcript source):');
      console.log(`📝 Length: ${searchResult.description.length} characters`);
      console.log(`📄 Preview: ${searchResult.description.substring(0, 500)}...`);
      console.log('');
      
      // Test 5: Try to summarize with OpenAI
      console.log('📋 Test 5: Attempting OpenAI Summarization');
      try {
        const summaryResponse = await axios.post('http://localhost:3001/transcripts/summarize', {
          text: searchResult.description.substring(0, 2000), // Limit to first 2000 chars
          videoId: videoId,
          title: searchResult.title
        });
        
        console.log('✅ OpenAI Summary Response:');
        console.log(JSON.stringify(summaryResponse.data, null, 2));
        console.log('');
      } catch (error) {
        console.log('❌ OpenAI summarization failed:', error.response?.data || error.message);
        console.log('');
      }
    } else {
      console.log('❌ No description/transcript data found');
      console.log('');
    }

    // Test 6: Check what our videos service returns for this video
    console.log('📋 Test 6: Checking Videos Service Response');
    try {
      const videosResponse = await axios.get(`http://localhost:3001/videos/digest`);
      const videoInDB = videosResponse.data.find(v => v.url && v.url.includes(videoId));
      
      if (videoInDB) {
        console.log('✅ Found video in database:');
        console.log(`📺 Title: ${videoInDB.title}`);
        console.log(`📝 Summary: ${videoInDB.summary?.substring(0, 200)}...`);
        console.log(`📊 Chapters: ${videoInDB.chapters?.length || 0}`);
        console.log('');
      } else {
        console.log('❌ Video not found in database');
        console.log('');
      }
    } catch (error) {
      console.log('❌ Could not check videos service:', error.response?.data || error.message);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSearchAPITranscript();



