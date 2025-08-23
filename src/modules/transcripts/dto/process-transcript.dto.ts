import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ProcessTranscriptDto {
  @IsString()
  videoId!: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsBoolean()
  useASR?: boolean;
}

