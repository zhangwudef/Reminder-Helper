export interface SourceUrl {
  url: string;
  title: string;
  channel: string;
}

export interface CrawledInfo {
  timestamp: string;
  source: string;
  keywords: string[];
  content: string;
  confidence: number;
  processDescription?: string;
  acquisitionTime?: string;
  sourceUrls?: SourceUrl[];
  keyPoints?: string[];
}

export interface Event {
  id: string;
  title: string;
  type: 'normal' | 'special';
  description: string;
  importance: 'high' | 'medium' | 'low';
  progress: number; // 0-100
  date: string; // ISO date string
  reminder?: {
    enabled: boolean;
    method: 'email' | 'notification' | 'sms';
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  };
  specialData?: {
    crawledInfo?: CrawledInfo;
    summary?: string;
  };
  isAIGenerated?: boolean; // 标记是否为AI生成的事件
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
}
