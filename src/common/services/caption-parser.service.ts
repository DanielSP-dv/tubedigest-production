import { Injectable, Logger } from '@nestjs/common';

export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface ParsedCaption {
  segments: CaptionSegment[];
  language?: string;
  format: string;
}

@Injectable()
export class CaptionParserService {
  private readonly logger = new Logger(CaptionParserService.name);

  parseSRT(srtContent: string): ParsedCaption {
    try {
      const segments: CaptionSegment[] = [];
      const blocks = srtContent.trim().split('\n\n');
      
      for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length < 3) continue;
        
        // Skip index line, parse timestamp line
        const timestampLine = lines[1];
        const textLines = lines.slice(2);
        
        const timeMatch = timestampLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
        if (!timeMatch) continue;
        
        const start = this.parseTimestamp(timeMatch[1]);
        const end = this.parseTimestamp(timeMatch[2]);
        const text = textLines.join(' ').trim();
        
        if (text) {
          segments.push({ start, end, text });
        }
      }
      
      return { segments, format: 'srt' };
    } catch (error) {
      this.logger.error('Error parsing SRT content:', error);
      throw new Error('Failed to parse SRT format');
    }
  }

  parseVTT(vttContent: string): ParsedCaption {
    try {
      const segments: CaptionSegment[] = [];
      const lines = vttContent.split('\n');
      let currentSegment: Partial<CaptionSegment> = {};
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('-->')) {
          const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
          if (timeMatch) {
            currentSegment.start = this.parseTimestamp(timeMatch[1]);
            currentSegment.end = this.parseTimestamp(timeMatch[2]);
          }
        } else if (line && currentSegment.start !== undefined) {
          if (!currentSegment.text) {
            currentSegment.text = line;
          } else {
            currentSegment.text += ' ' + line;
          }
        } else if (!line && currentSegment.text) {
          segments.push(currentSegment as CaptionSegment);
          currentSegment = {};
        }
      }
      
      // Add last segment if exists
      if (currentSegment.text) {
        segments.push(currentSegment as CaptionSegment);
      }
      
      return { segments, format: 'vtt' };
    } catch (error) {
      this.logger.error('Error parsing VTT content:', error);
      throw new Error('Failed to parse VTT format');
    }
  }

  private parseTimestamp(timestamp: string): number {
    const parts = timestamp.replace(',', '.').split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }

  extractTextFromSegments(segments: CaptionSegment[]): string {
    return segments.map(segment => segment.text).join(' ').trim();
  }

  detectFormat(content: string): string {
    if (content.includes('-->') && content.includes('\n\n')) {
      return 'srt';
    } else if (content.includes('WEBVTT') || content.includes('-->')) {
      return 'vtt';
    }
    return 'unknown';
  }
}

