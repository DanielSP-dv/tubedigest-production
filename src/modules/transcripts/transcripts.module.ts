import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranscriptsService } from './transcripts.service';
import { TranscriptsController } from './transcripts.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { CaptionsService } from '../../common/services/captions.service';
import { ASRService } from '../../common/services/asr.service';
import { CaptionParserService } from '../../common/services/caption-parser.service';
import { TextNormalizerService } from '../../common/services/text-normalizer.service';
import { LanguageDetectorService } from '../../common/services/language-detector.service';

@Module({
  imports: [ConfigModule],
  controllers: [TranscriptsController],
  providers: [
    TranscriptsService,
    PrismaService,
    CaptionsService,
    ASRService,
    CaptionParserService,
    TextNormalizerService,
    LanguageDetectorService,
  ],
  exports: [TranscriptsService],
})
export class TranscriptsModule {}

