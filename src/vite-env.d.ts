/// <reference types="vite/client" />

declare global {
  interface Window {
    WxLogin?: new (options: {
      id: string;
      appid: string;
      scope: string;
      redirect_uri: string;
      state: string;
      self_redirect?: boolean;
      styletype?: string;
      sizetype?: string;
      bgcolor?: string;
      rst?: string;
      style?: string | number;
      href?: string;
      lang?: 'en' | 'zh_CN';
      stylelite?: 0 | 1;
      fast_login?: 0 | 1;
      color_scheme?: 'auto' | 'dark' | 'light';
      onReady?: (ready: boolean) => void;
      onQRcodeReady?: () => void;
      onCleanup?: () => void;
    }) => unknown;
  }
}

export {};
