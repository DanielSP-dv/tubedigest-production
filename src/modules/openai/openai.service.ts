import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface SummarizationRequest {
  text: string;
  videoId: string;
  title: string;
}

export interface SummarizationResponse {
  summary: string;
  model: string;
  tokens_used: number;
  videoId: string;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai?: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not found in environment variables');
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async summarizeTranscript(request: SummarizationRequest): Promise<SummarizationResponse> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized - missing API key');
      }

      this.logger.log(`Summarizing transcript for video: ${request.videoId}`);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes YouTube video content. Create a concise, engaging summary of the video transcript. Focus on the main points, key insights, and actionable takeaways. Keep the summary informative but easy to read."
          },
          {
            role: "user", 
            content: `Please summarize this YouTube video transcript for "${request.title}":\n\n${request.text}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const summary = completion.choices[0].message.content;
      const usage = completion.usage;

      this.logger.log(`Successfully summarized video ${request.videoId} using ${usage?.total_tokens || 0} tokens`);

      return {
        summary: summary || 'No summary generated',
        model: completion.model,
        tokens_used: usage?.total_tokens || 0,
        videoId: request.videoId,
      };

    } catch (error) {
      this.logger.error(`Failed to summarize transcript for video ${request.videoId}:`, error);
      throw new Error(`OpenAI summarization failed: ${(error as Error).message}`);
    }
  }

  async generateChapters(request: SummarizationRequest): Promise<Array<{title: string, startS: number, endS: number}>> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized - missing API key');
      }

      this.logger.log(`Generating chapters for video: ${request.videoId}`);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates chapter timestamps for YouTube videos. Based on the video content, create 5-8 meaningful chapters with estimated start times. Return only a JSON array of objects with 'title', 'startS' (start time in seconds), and 'endS' (end time in seconds) fields."
          },
          {
            role: "user", 
            content: `Create chapters for this YouTube video "${request.title}":\n\n${request.text}`
          }
        ],
        max_tokens: 300,
        temperature: 0.5,
      });

      const response = completion.choices[0].message.content;
      
      try {
        const chapters = JSON.parse(response || '[]');
        this.logger.log(`Successfully generated ${chapters.length} chapters for video ${request.videoId}`);
        return chapters;
      } catch (parseError) {
        this.logger.warn(`Failed to parse chapters JSON for video ${request.videoId}, returning empty array`);
        return [];
      }

    } catch (error) {
      this.logger.error(`Failed to generate chapters for video ${request.videoId}:`, error);
      return [];
    }
  }

  isAvailable(): boolean {
    return !!this.openai && !!process.env.OPENAI_API_KEY;
  }
}
