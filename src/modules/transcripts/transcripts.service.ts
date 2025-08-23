import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CaptionsService } from '../../common/services/captions.service';
import { ASRService } from '../../common/services/asr.service';
import { CaptionParserService } from '../../common/services/caption-parser.service';
import { TextNormalizerService } from '../../common/services/text-normalizer.service';
import { LanguageDetectorService } from '../../common/services/language-detector.service';
import { CaptionResponse } from './interfaces/captions-provider.interface';
import { CreateTranscriptDto } from './dto/create-transcript.dto';
import { ProcessTranscriptDto } from './dto/process-transcript.dto';

@Injectable()
export class TranscriptsService {
  private readonly logger = new Logger(TranscriptsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly captionsService: CaptionsService,
    private readonly asrService: ASRService,
    private readonly captionParser: CaptionParserService,
    private readonly textNormalizer: TextNormalizerService,
    private readonly languageDetector: LanguageDetectorService,
  ) {}

  async processTranscript(dto: ProcessTranscriptDto): Promise<{
    success: boolean;
    transcriptId?: string;
    error?: string;
    source: string;
  }> {
    try {
      this.logger.log(`Processing transcript for video: ${dto.videoId}`);

      // Check if transcript already exists
      const existingTranscript = await this.prisma.transcript.findFirst({
        where: { videoId: dto.videoId }
      });

      if (existingTranscript) {
        this.logger.debug(`Transcript already exists for video: ${dto.videoId}`);
        return {
          success: true,
          transcriptId: existingTranscript.id,
          source: existingTranscript.source
        };
      }

      // Try to fetch captions from YouTube
      let captionResponse: CaptionResponse;
      let source = 'youtube';

      try {
        captionResponse = await this.captionsService.fetchCaptions(dto.videoId, dto.userEmail);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to fetch captions for ${dto.videoId}:`, errorMessage);
        captionResponse = { hasCaptions: false, error: errorMessage };
      }

      // If no captions and ASR is requested/enabled, try ASR
      if (!captionResponse.hasCaptions && (dto.useASR || this.asrService.isASREnabled())) {
        try {
          const video = await this.prisma.video.findUnique({
            where: { id: dto.videoId }
          });

          if (video) {
            this.logger.log(`Attempting ASR for video: ${dto.videoId}`);
            captionResponse = await this.asrService.runASR(video.url);
            source = 'asr';
          }
        } catch (error) {
          this.logger.error(`ASR failed for ${dto.videoId}:`, error);
        }
      }

      // If still no captions, log skip reason and return
      if (!captionResponse.hasCaptions) {
        await this.logSkipReason(dto.videoId, 'no_captions_available', captionResponse.error);
        return {
          success: false,
          error: 'No captions available',
          source: 'none'
        };
      }

      // Validate and normalize the transcript text
      const validation = this.textNormalizer.validateTextQuality(captionResponse.text || '');
      if (!validation.isValid) {
        this.logger.warn(`Transcript quality issues for ${dto.videoId}:`, validation.issues);
        await this.logSkipReason(dto.videoId, 'poor_quality', validation.issues.join(', '));
        return {
          success: false,
          error: 'Poor transcript quality',
          source
        };
      }

      // Check language priority
      if (captionResponse.language && !this.languageDetector.shouldProcessLanguage(captionResponse.text || '')) {
        this.logger.warn(`Skipping non-English transcript for ${dto.videoId}: ${captionResponse.language}`);
        await this.logSkipReason(dto.videoId, 'non_english_language', captionResponse.language);
        return {
          success: false,
          error: 'Non-English language not supported',
          source
        };
      }

      // Create transcript record
      const transcript = await this.createTranscript({
        videoId: dto.videoId,
        source: source as 'youtube' | 'asr' | 'manual',
        hasCaptions: true,
        text: captionResponse.text || '',
        language: captionResponse.language,
        format: captionResponse.format
      });

      this.logger.log(`Successfully processed transcript for ${dto.videoId}: ${transcript.id}`);
      
      return {
        success: true,
        transcriptId: transcript.id,
        source
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing transcript for ${dto.videoId}:`, error);
      return {
        success: false,
        error: errorMessage,
        source: 'error'
      };
    }
  }

  async createTranscript(dto: CreateTranscriptDto) {
    return await this.prisma.transcript.create({
      data: {
        videoId: dto.videoId,
        source: dto.source,
        hasCaptions: dto.hasCaptions,
        text: dto.text,
        language: dto.language,
        format: dto.format
      }
    });
  }

  async getTranscript(videoId: string) {
    return await this.prisma.transcript.findFirst({
      where: { videoId }
    });
  }

  async getTranscriptsByVideoIds(videoIds: string[]) {
    return await this.prisma.transcript.findMany({
      where: {
        videoId: { in: videoIds }
      }
    });
  }

  async batchProcessTranscripts(videoIds: string[], userEmail?: string): Promise<{
    processed: number;
    failed: number;
    skipped: number;
    results: Array<{ videoId: string; success: boolean; error?: string; source: string }>;
  }> {
    this.logger.log(`Starting batch transcript processing for ${videoIds.length} videos`);

    const results: Array<{ videoId: string; success: boolean; error?: string; source: string }> = [];
    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const videoId of videoIds) {
      try {
        const result = await this.processTranscript({
          videoId,
          userEmail,
          useASR: false // Batch processing defaults to captions only
        });

        if (result.success) {
          processed++;
        } else if (result.error === 'No captions available' || result.error === 'Non-English language not supported') {
          skipped++;
        } else {
          failed++;
        }

        results.push({
          videoId,
          success: result.success,
          error: result.error,
          source: result.source
        });
              } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Error in batch processing for ${videoId}:`, error);
          failed++;
          results.push({
            videoId,
            success: false,
            error: errorMessage,
            source: 'error'
          });
        }
    }

    this.logger.log(`Batch processing complete: ${processed} processed, ${failed} failed, ${skipped} skipped`);

    return {
      processed,
      failed,
      skipped,
      results
    };
  }

  private async logSkipReason(videoId: string, reason: string, details?: string) {
    try {
      // Store skip reason in a separate table or log it
      this.logger.warn(`Skipped transcript processing for ${videoId}: ${reason}${details ? ` - ${details}` : ''}`);
      
      // For now, we'll just log it. In a full implementation, you might want to store this in a separate table
      // await this.prisma.transcriptSkipLog.create({
      //   data: {
      //     videoId,
      //     reason,
      //     details,
      //     timestamp: new Date()
      //   }
      // });
    } catch (error) {
      this.logger.error(`Error logging skip reason for ${videoId}:`, error);
    }
  }

  async getProcessingStats(): Promise<{
    totalVideos: number;
    videosWithTranscripts: number;
    processingRate: number;
    bySource: Record<string, number>;
  }> {
    const totalVideos = await this.prisma.video.count();
    const videosWithTranscripts = await this.prisma.transcript.count();
    
    const bySource = await this.prisma.transcript.groupBy({
      by: ['source'],
      _count: {
        source: true
      }
    });

    const sourceStats: Record<string, number> = {};
    bySource.forEach(stat => {
      sourceStats[stat.source] = stat._count.source;
    });

    return {
      totalVideos,
      videosWithTranscripts,
      processingRate: totalVideos > 0 ? (videosWithTranscripts / totalVideos) * 100 : 0,
      bySource: sourceStats
    };
  }
}
