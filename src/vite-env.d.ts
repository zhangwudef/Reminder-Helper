/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WECHAT_APP_ID: string;
  readonly VITE_WECHAT_REDIRECT_URI: string;
  readonly VITE_BASE_PATH: string;
  readonly VITE_QWEN_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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
