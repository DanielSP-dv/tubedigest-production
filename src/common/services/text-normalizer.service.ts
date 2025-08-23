import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TextNormalizerService {
  private readonly logger = new Logger(TextNormalizerService.name);

  normalizeText(text: string): string {
    try {
      let normalized = text;
      
      // Remove HTML tags
      normalized = this.removeHtmlTags(normalized);
      
      // Remove special characters and formatting
      normalized = this.removeSpecialCharacters(normalized);
      
      // Normalize whitespace
      normalized = this.normalizeWhitespace(normalized);
      
      // Remove duplicate words/phrases
      normalized = this.removeDuplicates(normalized);
      
      // Trim and clean
      normalized = normalized.trim();
      
      return normalized;
    } catch (error) {
      this.logger.error('Error normalizing text:', error);
      return text; // Return original if normalization fails
    }
  }

  private removeHtmlTags(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }

  private removeSpecialCharacters(text: string): string {
    // Remove caption formatting characters
    return text
      .replace(/\[.*?\]/g, '') // Remove bracketed content
      .replace(/\(.*?\)/g, '') // Remove parenthetical content
      .replace(/♪/g, '') // Remove music symbols
      .replace(/[^\w\s.,!?-]/g, ' ') // Keep only alphanumeric, spaces, and basic punctuation
      .replace(/\s+/g, ' '); // Normalize multiple spaces
  }

  private normalizeWhitespace(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/\t+/g, ' ') // Replace tabs with spaces
      .trim();
  }

  private removeDuplicates(text: string): string {
    const words = text.split(' ');
    const uniqueWords: string[] = [];
    
    for (let i = 0; i < words.length; i++) {
      // Check for consecutive duplicate words
      if (i === 0 || words[i] !== words[i - 1]) {
        uniqueWords.push(words[i]);
      }
    }
    
    return uniqueWords.join(' ');
  }

  cleanCaptionText(text: string): string {
    // Remove common caption artifacts
    return text
      .replace(/^\d+\s*$/gm, '') // Remove standalone numbers
      .replace(/^[A-Z\s]+$/gm, '') // Remove all-caps lines (often speaker labels)
      .replace(/\b[A-Z]{2,}\b/g, '') // Remove acronyms in all caps
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  validateTextQuality(text: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!text || text.length === 0) {
      issues.push('Empty text');
    }
    
    if (text.length < 10) {
      issues.push('Text too short');
    }
    
    if (text.length > 50000) {
      issues.push('Text too long');
    }
    
    // Check for excessive special characters
    const specialCharRatio = (text.match(/[^\w\s]/g) || []).length / text.length;
    if (specialCharRatio > 0.3) {
      issues.push('Too many special characters');
    }
    
    // Check for repetitive content
    const words = text.split(' ');
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    if (repetitionRatio < 0.3) {
      issues.push('Too much repetitive content');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

