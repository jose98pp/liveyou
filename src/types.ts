export interface Channel {
  id: string;
  name: string;
  logo?: string;
  category?: string;
  now_playing?: string;
  time?: string;
  stream_url?: string;
}

export interface LiveEvent {
  id: string;
  title: string;
  tournament?: string;
  time?: string;
  status?: string; // 'LIVE', 'PROGRAMADO', 'FINALIZADO', 'En vivo', etc.
  sport?: string;
  channels?: string[];
  stream_url?: string;
  players?: { [key: string]: string };
}

export interface MediaItem {
  id: string;
  title: string;
  genre?: string;
  year?: string;
  rating?: string;
  duration?: string;
  seasons?: string;
  banner?: string;
  description?: string;
  type: "movie" | "series";
  stream_url?: string;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
  isFallback?: boolean;
  data?: any;
}
