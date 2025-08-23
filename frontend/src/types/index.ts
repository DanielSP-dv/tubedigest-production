export interface User {
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface Channel {
  id: string;
  title: string;
  selected: boolean;
  order?: number;
}

export interface Video {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  channelTitle: string;
}

export interface DigestPreferences {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  includeTranscripts: boolean;
  includeChapters: boolean;
  maxVideos: number;
}



