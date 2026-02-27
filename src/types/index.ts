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
    crawledInfo?: string;
    summary?: string;
  };
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
}
