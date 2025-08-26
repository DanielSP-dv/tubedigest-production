const axios = require('axios');

const testChannelFix = async () => {
  console.log('🔍 Testing Channel Selection Fix');
  console.log('===============================');

  try {
    // Test 1: Check backend data format
    console.log('\n1. Testing backend data format...');
    const selectedResponse = await axios.get('http://localhost:3001/channels/selected');
    const selectedChannels = selectedResponse.data;
    
    console.log(`   ✅ Selected channels: ${selectedChannels.length}`);
    console.log('   📋 Selected channels data:');
    selectedChannels.forEach((channel, index) => {
      console.log(`      ${index + 1}. channelId: "${channel.channelId}", title: "${channel.title}"`);
    });
    
    // Test 2: Check if data format is correct
    console.log('\n2. Verifying data format...');
    const hasCorrectFormat = selectedChannels.every(channel => 
      channel.hasOwnProperty('channelId') && 
      channel.hasOwnProperty('title') &&
      !channel.hasOwnProperty('id') &&
      !channel.hasOwnProperty('userId')
    );
    
    if (hasCorrectFormat) {
      console.log('   ✅ Data format is correct (only channelId and title)');
    } else {
      console.log('   ❌ Data format is incorrect (contains extra fields)');
    }
    
    // Test 3: Test frontend proxy
    console.log('\n3. Testing frontend proxy...');
    const frontendResponse = await axios.get('http://localhost:3000/api/channels/selected');
    const frontendData = frontendResponse.data;
    
    console.log(`   ✅ Frontend proxy data: ${frontendData.length} channels`);
    console.log('   📋 Frontend data format:');
    frontendData.forEach((channel, index) => {
      console.log(`      ${index + 1}. channelId: "${channel.channelId}", title: "${channel.title}"`);
    });
    
    // Test 4: Check if frontend and backend match
    console.log('\n4. Comparing frontend and backend data...');
    const backendIds = selectedChannels.map(ch => ch.channelId).sort();
    const frontendIds = frontendData.map(ch => ch.channelId).sort();
    
    const dataMatches = JSON.stringify(backendIds) === JSON.stringify(frontendIds);
    
    if (dataMatches) {
      console.log('   ✅ Frontend and backend data match');
    } else {
      console.log('   ❌ Frontend and backend data do not match');
      console.log(`      Backend: ${backendIds.join(', ')}`);
      console.log(`      Frontend: ${frontendIds.join(', ')}`);
    }
    
    console.log('\n🎯 Test Summary:');
    console.log(`   • Backend data format: ${hasCorrectFormat ? 'CORRECT' : 'INCORRECT'}`);
    console.log(`   • Frontend proxy working: ${frontendData.length > 0 ? 'YES' : 'NO'}`);
    console.log(`   • Data consistency: ${dataMatches ? 'MATCHES' : 'MISMATCH'}`);
    console.log(`   • Channel toggles should now work correctly`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
};

testChannelFix();
