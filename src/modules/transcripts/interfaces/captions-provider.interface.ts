export interface CaptionResponse {
  hasCaptions: boolean;
  text?: string;
  language?: string;
  format?: string;
  error?: string;
}

export interface CaptionsProvider {
  fetchCaptions(videoId: string, userEmail?: string): Promise<CaptionResponse>;
  runASR(videoUrl: string): Promise<CaptionResponse>;
}

