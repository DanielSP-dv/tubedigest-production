const axios = require('axios');

const testFrontendChannels = async () => {
  console.log('🔍 Testing Frontend Channel Data');
  console.log('=================================');
  
  try {
    // Test 1: Get channels through frontend proxy
    console.log('\n1. Fetching channels through frontend proxy...');
    const channelsResponse = await axios.get('http://localhost:3000/api/channels');
    const channels = channelsResponse.data;
    console.log(`   ✅ Found ${Array.isArray(channels) ? channels.length : 'N/A'} channels`);
    
    if (Array.isArray(channels) && channels.length > 0) {
      console.log('   📋 First 3 channels:');
      channels.slice(0, 3).forEach((channel, index) => {
        console.log(`      ${index + 1}. ID: ${channel.id || channel.channelId}, Title: ${channel.title}`);
      });
    }
    
    // Test 2: Get selected channels through frontend proxy
    console.log('\n2. Fetching selected channels through frontend proxy...');
    const selectedResponse = await axios.get('http://localhost:3000/api/channels/selected');
    const selectedChannels = selectedResponse.data;
    console.log(`   ✅ Found ${Array.isArray(selectedChannels) ? selectedChannels.length : 'N/A'} selected channels`);
    
    if (Array.isArray(selectedChannels) && selectedChannels.length > 0) {
      console.log('   📋 First 3 selected channels:');
      selectedChannels.slice(0, 3).forEach((selected, index) => {
        console.log(`      ${index + 1}. ID: ${selected.channelId}, Title: ${selected.title}`);
      });
    }
    
    // Test 3: Simulate frontend logic
    console.log('\n3. Simulating frontend selection logic...');
    if (Array.isArray(channels) && Array.isArray(selectedChannels)) {
      const selectedChannelIds = new Set(selectedChannels.map(s => s.channelId));
      
      console.log('   🔍 Selection check for first 5 channels:');
      channels.slice(0, 5).forEach((channel, index) => {
        const channelId = channel.id || channel.channelId;
        const isSelected = selectedChannelIds.has(channelId);
        console.log(`      ${index + 1}. ${channel.title}: ${isSelected ? '✅ SELECTED' : '❌ NOT SELECTED'} (ID: ${channelId})`);
      });
    }
    
    console.log('\n🎯 Frontend Test Summary:');
    console.log(`   • Total channels: ${Array.isArray(channels) ? channels.length : 'N/A'}`);
    console.log(`   • Selected channels: ${Array.isArray(selectedChannels) ? selectedChannels.length : 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
};

testFrontendChannels();



