const axios = require('axios');

const debugChannels = async () => {
  console.log('🔍 Debugging Channel Selection Issue');
  console.log('=====================================');
  
  try {
    // Test 1: Get all channels
    console.log('\n1. Fetching all channels...');
    const channelsResponse = await axios.get('http://localhost:3001/channels');
    const channels = channelsResponse.data;
    console.log(`   ✅ Found ${Array.isArray(channels) ? channels.length : 'N/A'} channels`);
    
    // Show first few channels
    console.log('   📋 First 3 channels:');
    if (Array.isArray(channels)) {
      channels.slice(0, 3).forEach((channel, index) => {
        console.log(`      ${index + 1}. ID: ${channel.channelId}, Title: ${channel.title}`);
      });
    } else {
      console.log('   ❌ Channels is not an array:', typeof channels);
      console.log('   📊 Channels data:', JSON.stringify(channels).substring(0, 200));
    }
    
    // Test 2: Get selected channels
    console.log('\n2. Fetching selected channels...');
    const selectedResponse = await axios.get('http://localhost:3001/channels/selected');
    const selectedChannels = selectedResponse.data;
    console.log(`   ✅ Found ${Array.isArray(selectedChannels) ? selectedChannels.length : 'N/A'} selected channels`);
    
    // Show selected channels
    console.log('   📋 Selected channels:');
    if (Array.isArray(selectedChannels)) {
      selectedChannels.forEach((selected, index) => {
        console.log(`      ${index + 1}. ID: ${selected.channelId}, Title: ${selected.title}`);
      });
    } else {
      console.log('   ❌ SelectedChannels is not an array:', typeof selectedChannels);
      console.log('   📊 SelectedChannels data:', JSON.stringify(selectedChannels).substring(0, 200));
    }
    
    // Test 3: Analyze the mismatch
    console.log('\n3. Analyzing data mismatch...');
    
    // Create a map of selected channel IDs
    const selectedChannelIds = Array.isArray(selectedChannels) ? new Set(selectedChannels.map(s => s.channelId)) : new Set();
    
    // Check which channels should be selected
    console.log('   🔍 Checking which channels should be selected:');
    if (Array.isArray(channels)) {
      channels.forEach((channel, index) => {
        const isSelected = selectedChannelIds.has(channel.channelId);
        console.log(`      ${index + 1}. ${channel.title}: ${isSelected ? '✅ SELECTED' : '❌ NOT SELECTED'}`);
      });
    }
    
    // Test 4: Simulate frontend logic
    console.log('\n4. Simulating frontend logic...');
    
    // Simulate the frontend mapping
    if (Array.isArray(channels)) {
      const mappedChannels = channels.map(channel => ({
        id: channel.channelId, // This is what frontend does
        title: channel.title,
        thumbnail: channel.thumbnail
      }));
      
      console.log('   🔄 After frontend mapping:');
      mappedChannels.slice(0, 3).forEach((channel, index) => {
        console.log(`      ${index + 1}. ID: ${channel.id}, Title: ${channel.title}`);
      });
      
      // Simulate the selection check
      console.log('   🔍 Selection check simulation:');
      mappedChannels.forEach((channel, index) => {
        const isSelected = Array.isArray(selectedChannels) ? selectedChannels.some(selected => selected.channelId === channel.id) : false;
        console.log(`      ${index + 1}. ${channel.title}: ${isSelected ? '✅ SELECTED' : '❌ NOT SELECTED'}`);
      });
    }
    
    // Test 5: Check if there's a data type issue
    console.log('\n5. Checking for data type issues...');
    if (Array.isArray(selectedChannels) && Array.isArray(channels)) {
      const firstSelected = selectedChannels[0];
      const firstChannel = channels[0];
      
      if (firstSelected && firstChannel) {
        console.log(`   📊 Selected channel ID type: ${typeof firstSelected.channelId}`);
        console.log(`   📊 Channel ID type: ${typeof firstChannel.channelId}`);
        console.log(`   📊 Comparison result: ${firstSelected.channelId === firstChannel.channelId}`);
        console.log(`   📊 Selected: "${firstSelected.channelId}"`);
        console.log(`   📊 Channel: "${firstChannel.channelId}"`);
      }
    }
    
    console.log('\n🎯 Debug Summary:');
    console.log(`   • Total channels: ${Array.isArray(channels) ? channels.length : 'N/A'}`);
    console.log(`   • Selected channels: ${Array.isArray(selectedChannels) ? selectedChannels.length : 'N/A'}`);
    console.log(`   • Expected selected count: ${Array.isArray(selectedChannels) ? selectedChannels.length : 0}/10`);
    
    // Identify the issue
    if (Array.isArray(selectedChannels) && selectedChannels.length > 0) {
      console.log('\n🔧 Potential Issues:');
      console.log('   1. Frontend cache not refreshed');
      console.log('   2. React Query stale data');
      console.log('   3. Component not re-rendering');
      console.log('   4. Data structure mismatch');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
};

debugChannels();

