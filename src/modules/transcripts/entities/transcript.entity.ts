import { Prisma } from '@prisma/client';

export interface Transcript {
  id: string;
  videoId: string;
  source: 'youtube' | 'asr' | 'manual';
  hasCaptions: boolean;
  text: string;
  language?: string;
  format?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TranscriptCreateInput = Prisma.TranscriptCreateInput;
export type TranscriptUpdateInput = Prisma.TranscriptUpdateInput;
export type TranscriptWhereInput = Prisma.TranscriptWhereInput;

