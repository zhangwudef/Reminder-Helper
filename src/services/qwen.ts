const API_KEY = import.meta.env.VITE_QWEN_API_KEY;
const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export interface QwenRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface QwenResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface QwenError {
  code: string;
  message: string;
  request_id: string;
}

export interface EventMonitorResult {
  processDescription: string;
  acquisitionTime: string;
  sourceUrls: Array<{
    url: string;
    title: string;
    channel: string;
  }>;
  keyPoints: string[];
  confidence: number;
}

const requestHistory: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 30;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

function checkRateLimit(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  
  while (requestHistory.length > 0 && requestHistory[0] < oneMinuteAgo) {
    requestHistory.shift();
  }
  
  if (requestHistory.length >= MAX_REQUESTS_PER_MINUTE) {
    console.warn('[Qwen] Rate limit exceeded', { currentRequests: requestHistory.length });
    return false;
  }
  
  requestHistory.push(now);
  return true;
}

function logAction(action: string, details: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Qwen] ${action}:`, details);
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanData(content: string): string {
  const cleanedContent = content
    .replace(/\b\d{11}\b/g, '[手机号码]')
    .replace(/\b\d{18}\b/g, '[身份证号]')
    .replace(/\b\w+@\w+\.\w+\b/g, '[邮箱地址]');
  
  return cleanedContent;
}

function parseEventInfo(content: string, keywords: string[]): EventMonitorResult {
  const now = new Date().toISOString();
  
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  const urls = content.match(urlRegex) || [];
  
  const sourceUrls = urls.slice(0, 5).map(url => {
    let channel = '网络来源';
    try {
      const hostname = new URL(url).hostname;
      if (hostname.includes('sina')) channel = '新浪财经';
      else if (hostname.includes('eastmoney')) channel = '东方财富';
      else if (hostname.includes('xinhua')) channel = '新华网';
      else if (hostname.includes('people')) channel = '人民网';
      else if (hostname.includes('cctv')) channel = '央视网';
      else if (hostname.includes('finance.sina')) channel = '新浪财经';
      else if (hostname.includes('10jqka')) channel = '同花顺';
      else if (hostname.includes('hexun')) channel = '和讯网';
      else if (hostname.includes('cs')) channel = '中证网';
      else if (hostname.includes('cnstock')) channel = '中国证券网';
      else channel = hostname.replace('www.', '');
    } catch {
      channel = '网络来源';
    }
    return {
      url,
      title: `${keywords.join(' ')} - 相关报道`,
      channel
    };
  });

  const lines = content.split('\n').filter(line => line.trim());
  const keyPoints: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || 
        /^\d+[.、]/.test(trimmed)) {
      keyPoints.push(trimmed);
    }
    if (keyPoints.length >= 5) break;
  }

  if (keyPoints.length === 0 && content.length > 100) {
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
    keyPoints.push(...sentences.slice(0, 3).map(s => s.trim() + '。'));
  }

  let confidence = 0.75;
  if (sourceUrls.length > 0) confidence += 0.1;
  if (keyPoints.length >= 3) confidence += 0.05;
  if (content.length > 200) confidence += 0.05;
  confidence = Math.min(confidence, 0.95);

  return {
    processDescription: content,
    acquisitionTime: now,
    sourceUrls,
    keyPoints,
    confidence
  };
}

export async function callQwenAPI(
  prompt: string, 
  systemPrompt: string = '你是一个专业的财经事件信息分析助手，负责根据用户提供的关键词，搜索并提供准确、全面的事件信息。',
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<string> {
  if (!API_KEY) {
    throw new Error('千问API密钥未配置，请在环境变量中设置VITE_QWEN_API_KEY');
  }

  if (!checkRateLimit()) {
    throw new Error('请求频率超限，请稍后再试。每分钟最多30次请求。');
  }

  const request: QwenRequest = {
    model: 'qwen-plus',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature,
    max_tokens: maxTokens,
    stream: false
  };

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logAction(`API调用尝试 ${attempt}/${MAX_RETRIES}`, { promptLength: prompt.length });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: QwenError = await response.json().catch(() => ({ 
          code: 'UNKNOWN', 
          message: `HTTP错误: ${response.status}`,
          request_id: ''
        }));
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY * attempt;
          logAction('触发限流，等待重试', { waitTime, attempt });
          await delay(waitTime);
          continue;
        }
        
        if (response.status === 401) {
          throw new Error('API密钥无效或已过期，请检查配置');
        }
        
        if (response.status === 402) {
          throw new Error('API余额不足，请充值后继续使用');
        }
        
        throw new Error(`API请求失败: ${errorData.message || response.statusText}`);
      }

      const data: QwenResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('API返回数据格式异常：无有效响应内容');
      }

      const result = data.choices[0].message.content;
      logAction('API调用成功', { 
        responseLength: result.length, 
        tokensUsed: data.usage?.total_tokens || 0 
      });
      
      return result;
      
    } catch (error) {
      lastError = error as Error;
      logAction(`API调用失败 (尝试 ${attempt}/${MAX_RETRIES})`, { 
        error: lastError.message 
      });
      
      if (lastError.message.includes('API密钥') || 
          lastError.message.includes('余额不足')) {
        throw lastError;
      }
      
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY * attempt);
      }
    }
  }

  throw new Error(`千问API调用失败，已重试${MAX_RETRIES}次: ${lastError?.message}`);
}

export async function monitorEventByQwen(keyword: string): Promise<EventMonitorResult> {
  if (!keyword.trim()) {
    throw new Error('请输入要监控的事件关键词');
  }

  logAction('开始监控事件', { keyword });

  const systemPrompt = `你是一个专业的财经事件信息分析助手。你的任务是：
1. 根据用户提供的关键词，提供该事件的详细信息
2. 包括事件的背景、最新进展、影响分析
3. 尽可能提供信息来源网址
4. 总结关键要点

请按以下格式回复：
【事件概述】
简要描述事件背景和主要内容

【最新进展】
列出事件的最新动态和发展过程

【关键要点】
• 要点1
• 要点2
• 要点3

【信息来源】
列出相关的信息来源网址

【影响分析】
分析该事件可能带来的影响`;

  const prompt = `请帮我查询关于"${keyword}"的最新信息，包括：
1. 事件的完整背景和发展过程
2. 最新的进展和动态
3. 相关的信息来源网址
4. 该事件的主要影响

请提供详细、准确的信息。`;

  try {
    const content = await callQwenAPI(prompt, systemPrompt, 0.7, 2000);
    const cleanedContent = cleanData(content);
    
    const keywords = keyword.split(/[,，、\s]+/).filter(k => k.trim());
    const result = parseEventInfo(cleanedContent, keywords);
    
    logAction('事件监控完成', { 
      keyword, 
      sourceCount: result.sourceUrls.length,
      keyPointsCount: result.keyPoints.length,
      confidence: result.confidence 
    });
    
    return result;
    
  } catch (error) {
    logAction('事件监控失败', { keyword, error: (error as Error).message });
    throw error;
  }
}

export async function generateEventSummary(eventContent: string): Promise<string> {
  const systemPrompt = '你是一个专业的财经事件摘要助手，负责将长文本内容压缩为简洁、准确的摘要。';
  const prompt = `请为以下事件内容生成一个简洁的摘要（100字以内）：\n\n${eventContent}`;
  
  return await callQwenAPI(prompt, systemPrompt, 0.5, 200);
}

export async function analyzeEventImpact(keyword: string, eventContent: string): Promise<string> {
  const systemPrompt = '你是一个专业的财经分析师，负责分析事件对市场和经济的影响。';
  const prompt = `请分析"${keyword}"事件的影响：\n\n${eventContent}\n\n请从以下几个方面分析：
1. 对相关行业的影响
2. 对市场情绪的影响
3. 对投资者的建议`;

  return await callQwenAPI(prompt, systemPrompt, 0.7, 500);
}

export function getQwenServiceStatus(): {
  configured: boolean;
  rateLimit: {
    used: number;
    limit: number;
    remaining: number;
  };
} {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const recentRequests = requestHistory.filter(t => t > oneMinuteAgo).length;
  
  return {
    configured: !!API_KEY,
    rateLimit: {
      used: recentRequests,
      limit: MAX_REQUESTS_PER_MINUTE,
      remaining: MAX_REQUESTS_PER_MINUTE - recentRequests
    }
  };
}
