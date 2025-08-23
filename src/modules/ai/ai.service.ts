import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateSummary(transcript: string): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model = this.configService.get<string>('AI_MODEL', 'gpt-4o-mini');
    const maxTokens = parseInt(this.configService.get<string>('AI_MAX_TOKENS', '1000'), 10);

    this.logger.log(`AI Service - API Key: ${apiKey ? 'Present' : 'Missing'}, Model: ${model}, Max Tokens: ${maxTokens}`);

    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured, using mock summary');
      return this.generateMockSummary(transcript);
    }

    try {
      this.logger.log('Generating AI summary from transcript using OpenAI');
      
      const requestBody = {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise, informative summaries of video transcripts. Focus on the main points and key insights.'
          },
          {
            role: 'user',
            content: `Please provide a concise summary of this video transcript in 2-3 sentences:\n\n${transcript}`
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      };

      this.logger.log('Making OpenAI API call for summary generation...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      this.logger.log(`Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('OpenAI API error response:', JSON.stringify(errorData, null, 2));
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const summary = data.choices[0]?.message?.content || 'No summary generated';
      
      this.logger.log('AI summary generated successfully:', summary.substring(0, 100) + '...');
      return summary;
    } catch (error) {
      this.logger.error('Error generating AI summary:', error);
      this.logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return this.generateMockSummary(transcript);
    }
  }

  async extractChapters(transcript: string): Promise<Array<{ startS: number; endS: number; title: string }>> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model = this.configService.get<string>('AI_MODEL', 'gpt-4o-mini');
    const maxTokens = parseInt(this.configService.get<string>('AI_MAX_TOKENS', '1000'), 10);

    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured, using mock chapters');
      return this.extractMockChapters(transcript);
    }

    try {
      this.logger.log('Extracting chapters from transcript using OpenAI');
      
      const requestBody = {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes video transcripts and identifies chapter boundaries. Return a JSON array of chapters with startS (start time in seconds), endS (end time in seconds), and title (chapter title).'
          },
          {
            role: 'user',
            content: `Please analyze this video transcript and identify chapter boundaries. Return a JSON array:\n\n${transcript}`
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.3
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('OpenAI API error response:', JSON.stringify(errorData, null, 2));
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '[]';
      
      try {
        const chapters = JSON.parse(content);
        this.logger.log('AI chapters extracted successfully:', chapters.length, 'chapters');
        return Array.isArray(chapters) ? chapters : [];
      } catch (parseError) {
        this.logger.warn('Failed to parse AI chapters response, using mock data');
        return this.extractMockChapters(transcript);
      }
    } catch (error) {
      this.logger.error('Error extracting chapters:', error);
      return this.extractMockChapters(transcript);
    }
  }

  private generateMockSummary(transcript: string): string {
    // Generate a realistic mock summary based on transcript length
    const wordCount = transcript.split(' ').length;
    
    if (wordCount < 50) {
      return 'This video contains a brief discussion with limited content available for summarization.';
    } else if (wordCount < 200) {
      return 'This video presents a concise overview of the topic, covering key points in a brief format suitable for quick understanding.';
    } else {
      return `This comprehensive video covers multiple aspects of the subject matter. The content includes detailed explanations, practical examples, and insights that provide valuable information for viewers. The presentation is well-structured and offers both theoretical background and practical applications. Key takeaways include important concepts that viewers can apply in their own contexts.`;
    }
  }

  private extractMockChapters(transcript: string): Array<{ startS: number; endS: number; title: string }> {
    // Generate realistic mock chapters based on transcript length
    const wordCount = transcript.split(' ').length;
    const duration = Math.max(300, Math.floor(wordCount / 2)); // Rough estimate: 2 words per second
    
    const chapters = [];
    const chapterCount = Math.min(5, Math.floor(duration / 300)); // Max 5 chapters, one every 5 minutes
    
    for (let i = 0; i < chapterCount; i++) {
      const startS = i * 300;
      const endS = Math.min((i + 1) * 300, duration);
      
      const titles = [
        'Introduction',
        'Main Topic 1',
        'Main Topic 2', 
        'Main Topic 3',
        'Conclusion'
      ];
      
      chapters.push({
        startS,
        endS,
        title: titles[i] || `Chapter ${i + 1}`
      });
    }
    
    return chapters;
  }

  async analyzeSentiment(transcript: string): Promise<{ sentiment: string; confidence: number }> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model = this.configService.get<string>('AI_MODEL', 'gpt-4');

    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured, using mock sentiment');
      return this.generateMockSentiment();
    }

    try {
      this.logger.log('Analyzing sentiment using OpenAI');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that analyzes the sentiment of video transcripts. Return only a JSON object with "sentiment" (positive, neutral, or negative) and "confidence" (0.0 to 1.0).'
            },
            {
              role: 'user',
              content: `Analyze the sentiment of this video transcript:\n\n${transcript}`
            }
          ],
          max_tokens: 100,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const sentimentText = data.choices[0]?.message?.content?.trim();
      
      if (!sentimentText) {
        throw new Error('No sentiment analysis generated from OpenAI API');
      }

      try {
        const sentiment = JSON.parse(sentimentText);
        return sentiment;
      } catch (parseError) {
        this.logger.warn('Failed to parse sentiment response as JSON, using mock');
        return this.generateMockSentiment();
      }
    } catch (error) {
      this.logger.error('Error analyzing sentiment:', error);
      return this.generateMockSentiment();
    }
  }

  private generateMockSentiment(): { sentiment: string; confidence: number } {
    const sentiments = ['positive', 'neutral', 'negative'];
    const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence
    
    return {
      sentiment: randomSentiment,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  async extractKeyTopics(transcript: string): Promise<string[]> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model = this.configService.get<string>('AI_MODEL', 'gpt-4');

    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured, using mock topics');
      return this.generateMockTopics();
    }

    try {
      this.logger.log('Extracting key topics using OpenAI');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that identifies key topics from video transcripts. Return only a JSON array of 3-5 topic strings.'
            },
            {
              role: 'user',
              content: `Identify the key topics discussed in this video transcript:\n\n${transcript}`
            }
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const topicsText = data.choices[0]?.message?.content?.trim();
      
      if (!topicsText) {
        throw new Error('No topics generated from OpenAI API');
      }

      try {
        const topics = JSON.parse(topicsText);
        if (Array.isArray(topics)) {
          return topics;
        } else {
          throw new Error('Topics response is not an array');
        }
      } catch (parseError) {
        this.logger.warn('Failed to parse topics response as JSON, using mock');
        return this.generateMockTopics();
      }
    } catch (error) {
      this.logger.error('Error extracting key topics:', error);
      return this.generateMockTopics();
    }
  }

  private generateMockTopics(): string[] {
    const topics = [
      'Technology',
      'Programming',
      'Design',
      'Business',
      'Education',
      'Science',
      'Health',
      'Entertainment'
    ];
    
    const selectedTopics: string[] = [];
    const topicCount = Math.min(3, Math.floor(Math.random() * 4) + 1);
    
    for (let i = 0; i < topicCount; i++) {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      if (!selectedTopics.includes(topic)) {
        selectedTopics.push(topic);
      }
    }
    
    return selectedTopics;
  }
}
