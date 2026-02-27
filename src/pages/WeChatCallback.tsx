import React, { useEffect, useMemo, useState } from 'react';

const WeChatCallback = () => {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const code = params.get('code') ?? '';
  const state = params.get('state') ?? '';

  useEffect(() => {
    if (!code) {
      setError('缺少 code 参数');
      return;
    }

    const payload = { type: 'wechat_login_callback', code, state };
    const targetOrigin = window.location.origin;

    try {
      if (window.opener && window.opener !== window) {
        window.opener.postMessage(payload, targetOrigin);
        setSent(true);
        window.close();
        return;
      }

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, targetOrigin);
        setSent(true);
        return;
      }

      window.postMessage(payload, targetOrigin);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送登录结果失败');
    }
  }, [code, state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-xl font-bold mb-2">微信登录回调</h1>
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : sent ? (
          <p className="text-gray-700">已将登录信息发送到登录页，可返回继续操作。</p>
        ) : (
          <p className="text-gray-700">处理中...</p>
        )}
      </div>
    </div>
  );
};

export default WeChatCallback;
