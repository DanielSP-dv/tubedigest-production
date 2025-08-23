import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LanguageDetectorService {
  private readonly logger = new Logger(LanguageDetectorService.name);

  // Common English words for basic detection
  private readonly englishWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
    'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
    'give', 'day', 'most', 'us'
  ]);

  detectLanguage(text: string): { language: string; confidence: number } {
    try {
      if (!text || text.length === 0) {
        return { language: 'unknown', confidence: 0 };
      }

      // Convert to lowercase and split into words
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);

      if (words.length === 0) {
        return { language: 'unknown', confidence: 0 };
      }

      // Count English words
      let englishCount = 0;
      for (const word of words) {
        if (this.englishWords.has(word)) {
          englishCount++;
        }
      }

      const englishRatio = englishCount / words.length;
      const confidence = Math.min(englishRatio * 2, 1); // Scale confidence

      // Determine language based on English word ratio
      if (englishRatio > 0.3) {
        return { language: 'en', confidence };
      } else if (englishRatio > 0.1) {
        return { language: 'en', confidence: 0.5 }; // Low confidence English
      } else {
        return { language: 'unknown', confidence: 0 };
      }
    } catch (error) {
      this.logger.error('Error detecting language:', error);
      return { language: 'unknown', confidence: 0 };
    }
  }

  isEnglish(text: string): boolean {
    const result = this.detectLanguage(text);
    return result.language === 'en' && result.confidence > 0.5;
  }

  shouldProcessLanguage(text: string): boolean {
    // Priority: English only for now
    return this.isEnglish(text);
  }

  getLanguagePriority(language: string): number {
    const priorities: Record<string, number> = {
      'en': 1, // Highest priority
      'es': 2,
      'fr': 3,
      'de': 4,
      'unknown': 999 // Lowest priority
    };
    
    return priorities[language] || 999;
  }

  extractLanguageFromYouTubeResponse(response: any): string {
    try {
      // Try to extract language from YouTube API response
      if (response?.snippet?.language) {
        return response.snippet.language;
      }
      
      if (response?.items?.[0]?.snippet?.language) {
        return response.items[0].snippet.language;
      }
      
      return 'unknown';
    } catch (error) {
      this.logger.error('Error extracting language from YouTube response:', error);
      return 'unknown';
    }
  }
}

