import { create } from 'zustand';
import { Event } from '@/types';

interface EventState {
  events: Event[];
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  getEventsByDate: (date: string) => Event[];
}

// Pre-generated data
const initialEvents: Event[] = [
  {
    id: '1',
    title: '团队周会',
    type: 'normal',
    description: '每周一上午10点例会',
    importance: 'medium',
    progress: 50,
    date: new Date().toISOString().split('T')[0], // Today
    reminder: {
      enabled: true,
      method: 'notification',
      frequency: 'weekly'
    }
  },
  {
    id: '2',
    title: '项目进度汇总',
    type: 'special',
    description: '每日推送项目相关数据',
    importance: 'high',
    progress: 30,
    date: new Date().toISOString().split('T')[0], // Today
    specialData: {
      summary: '今日项目进展顺利，前端完成基础架构搭建...'
    }
  }
];

export const useEventStore = create<EventState>((set, get) => ({
  events: initialEvents,
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  updateEvent: (id, updates) => set((state) => ({
    events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e))
  })),
  deleteEvent: (id) => set((state) => ({
    events: state.events.filter((e) => e.id !== id)
  })),
  getEventsByDate: (date) => {
    return get().events.filter(e => e.date.startsWith(date));
  }
}));
