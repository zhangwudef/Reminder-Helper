import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore, type WeChatUser } from '@/store/useUserStore';

const Login = () => {
  const navigate = useNavigate();
  const login = useUserStore((state) => state.login);
  const [status, setStatus] = useState<'init' | 'loading' | 'ready' | 'exchanging' | 'error'>('init');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    login();
    navigate('/dashboard');
  };

  const wxAppId = import.meta.env.VITE_WX_APPID as string | undefined;
  const redirectUri = useMemo(() => `${window.location.origin}/wechat-callback`, []);

  useEffect(() => {
    const loadWxScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.WxLogin) {
          resolve();
          return;
        }

        const existing = document.querySelector<HTMLScriptElement>('script[data-wxlogin="true"]');
        if (existing) {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('微信登录脚本加载失败')), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
        script.async = true;
        script.dataset.wxlogin = 'true';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('微信登录脚本加载失败'));
        document.body.appendChild(script);
      });

    const init = async () => {
      if (!wxAppId) {
        setStatus('error');
        setError('缺少 VITE_WX_APPID 配置');
        return;
      }

      setStatus('loading');
      setError(null);

      const state = crypto.getRandomValues(new Uint32Array(4)).join('-');
      sessionStorage.setItem('wx_login_state', state);

      try {
        await loadWxScript();
        if (!window.WxLogin) {
          throw new Error('WxLogin 未加载');
        }

        new window.WxLogin({
          id: 'wechat-qrcode',
          appid: wxAppId,
          scope: 'snsapi_login',
          redirect_uri: encodeURIComponent(redirectUri),
          state,
          self_redirect: true,
        });

        setStatus('ready');
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : '初始化失败');
      }
    };

    init();
  }, [redirectUri, wxAppId]);

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const data = event.data as { type?: string; code?: string; state?: string } | null;
      if (!data || data.type !== 'wechat_login_callback') return;

      const code = data.code ?? '';
      const state = data.state ?? '';
      const expectedState = sessionStorage.getItem('wx_login_state') ?? '';

      if (!code) {
        setStatus('error');
        setError('缺少 code');
        return;
      }

      if (!state || !expectedState || state !== expectedState) {
        setStatus('error');
        setError('state 校验失败');
        return;
      }

      setStatus('exchanging');
      setError(null);

      try {
        const resp = await fetch('/api/auth/wechat/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const json = (await resp.json()) as { user?: WeChatUser; message?: string };
        if (!resp.ok) {
          throw new Error(json.message || '后端接口调用失败');
        }

        login(json.user);
        navigate('/dashboard');
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : '登录失败');
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [login, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center">微信扫码登录</h1>
        <div className="w-[300px] h-[400px] mb-4 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
          <div id="wechat-qrcode" />
        </div>
        <p className="text-center text-gray-600 mb-4">请使用微信扫描二维码登录</p>
        {status !== 'ready' && (
          <p className="text-center text-sm text-gray-500 mb-4">
            {status === 'loading' && '二维码加载中...'}
            {status === 'exchanging' && '登录处理中...'}
            {status === 'error' && (error || '发生错误')}
            {status === 'init' && '初始化中...'}
          </p>
        )}
        <div className="text-center">
          <button onClick={handleLogin} className="text-blue-600 hover:underline">
            模拟登录成功 (开发用)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
