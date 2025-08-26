const axios = require('axios');

async function testRealTranscript() {
  console.log('🎯 Testing Real Transcript Retrieval and OpenAI Summarization');
  console.log('===========================================================\n');

  try {
    // Step 1: Get real video data from SearchAPI
    console.log('📋 Step 1: Getting Real Video Data from SearchAPI');
    const searchResponse = await axios.get('https://www.searchapi.io/api/v1/search', {
      params: {
        engine: 'youtube',
        q: 'Chris Williamson latest video',
        api_key: 'MwZLa4Xo12MR8HUAK7KYQa5e'
      }
    });

    if (!searchResponse.data.videos || searchResponse.data.videos.length === 0) {
      console.log('❌ No videos found in SearchAPI response');
      return;
    }

    const video = searchResponse.data.videos[0];
    console.log('✅ Found video:', video.title);
    console.log('📺 Video ID:', video.id);
    console.log('🔗 URL:', video.link);
    console.log('📊 Views:', video.views);
    console.log('⏱️ Duration:', video.length);
    console.log('📅 Published:', video.published_time);
    console.log('');

    // Step 2: Extract transcript-like data
    console.log('📋 Step 2: Extracting Transcript Data');
    
    // Combine description with key moments to create a transcript-like text
    let transcriptText = '';
    
    if (video.description) {
      transcriptText += `Video Description:\n${video.description}\n\n`;
    }
    
    if (video.key_moments && video.key_moments.length > 0) {
      transcriptText += 'Key Moments:\n';
      video.key_moments.forEach((moment, index) => {
        const minutes = Math.floor(moment.start_seconds / 60);
        const seconds = moment.start_seconds % 60;
        const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        transcriptText += `${timestamp} - ${moment.title}\n`;
      });
      transcriptText += '\n';
    }

    console.log('📝 Transcript Length:', transcriptText.length, 'characters');
    console.log('📄 Transcript Preview:');
    console.log(transcriptText.substring(0, 500) + '...');
    console.log('');

    // Step 3: Create a simple OpenAI summarization
    console.log('📋 Step 3: Creating OpenAI Summary');
    
    // For now, let's create a simple summary using the available data
    // In a real implementation, you would call OpenAI API here
    const summary = createSimpleSummary(video);
    
    console.log('✅ Generated Summary:');
    console.log(summary);
    console.log('');

    // Step 4: Show what a real OpenAI call would look like
    console.log('📋 Step 4: OpenAI API Call Structure (Example)');
    console.log('To implement real OpenAI summarization, you would:');
    console.log('1. Install openai package: npm install openai');
    console.log('2. Set OPENAI_API_KEY in environment');
    console.log('3. Call OpenAI API with the transcript text');
    console.log('');
    
    const openaiExample = `
// Example OpenAI API call:
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant that summarizes YouTube video content. Create a concise, engaging summary of the video transcript."
    },
    {
      role: "user", 
      content: \`Please summarize this YouTube video transcript:\\n\\n\${transcriptText}\`
    }
  ],
  max_tokens: 500,
  temperature: 0.7
});

const summary = completion.choices[0].message.content;
    `;
    
    console.log(openaiExample);
    console.log('');

    // Step 5: Show the complete data structure
    console.log('📋 Step 5: Complete Video Data Structure');
    console.log('Available fields from SearchAPI:');
    console.log('- title: Video title');
    console.log('- description: Video description (potential transcript source)');
    console.log('- key_moments: Array of timestamps and titles');
    console.log('- views: View count');
    console.log('- length: Video duration');
    console.log('- published_time: Publication date');
    console.log('- channel: Channel information');
    console.log('- thumbnail: Video thumbnails');
    console.log('');

    console.log('🎯 Summary:');
    console.log('✅ SearchAPI is working and returning real video data');
    console.log('✅ We can extract transcript-like content from descriptions and key moments');
    console.log('✅ Ready to implement OpenAI summarization');
    console.log('✅ This provides a foundation for real transcript processing');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

function createSimpleSummary(video) {
  const title = video.title;
  const description = video.description || '';
  const keyMoments = video.key_moments || [];
  
  let summary = `Summary of "${title}"\n\n`;
  
  // Extract key topics from description
  const descriptionWords = description.toLowerCase().split(' ').slice(0, 20).join(' ');
  summary += `This video explores ${descriptionWords}...\n\n`;
  
  // Add key moments as bullet points
  if (keyMoments.length > 0) {
    summary += 'Key Topics Covered:\n';
    keyMoments.slice(0, 5).forEach(moment => {
      summary += `• ${moment.title}\n`;
    });
  }
  
  summary += `\nVideo Duration: ${video.length}`;
  summary += `\nPublished: ${video.published_time}`;
  summary += `\nViews: ${video.views.toLocaleString()}`;
  
  return summary;
}

testRealTranscript();



