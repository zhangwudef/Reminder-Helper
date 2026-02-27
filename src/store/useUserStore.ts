import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WeChatUser {
  openid: string;
  unionid?: string;
  nickname?: string;
  avatarUrl?: string;
  sex?: number;
  province?: string;
  city?: string;
  country?: string;
}

interface UserState {
  isLoggedIn: boolean;
  user: WeChatUser | null;
  login: (user?: WeChatUser) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      login: (user) => set({ isLoggedIn: true, user: user ?? null }),
      logout: () => set({ isLoggedIn: false, user: null }),
    }),
    {
      name: 'user-storage',
    }
  )
);
