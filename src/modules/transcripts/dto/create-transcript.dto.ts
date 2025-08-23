import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export class CreateTranscriptDto {
  @IsString()
  videoId!: string;

  @IsEnum(['youtube', 'asr', 'manual'])
  source!: 'youtube' | 'asr' | 'manual';

  @IsBoolean()
  hasCaptions!: boolean;

  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  format?: string;
}

