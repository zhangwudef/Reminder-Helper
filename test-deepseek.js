// 测试DeepSeek API调用
const API_KEY = process.env.VITE_DEEPSEEK_API_KEY || 'sk-3b598058260948ad8fdd25ce545de8e8';
const API_URL = 'https://api.deepseek.com/chat/completions';

async function testDeepSeekAPI() {
  console.log('Testing DeepSeek API...');
  
  const request = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: '你是一个信息整合助手，负责根据用户提供的信息，生成简洁、准确的事件摘要。'
      },
      {
        role: 'user',
        content: '请根据关键词"项目会议"生成事件摘要'
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(request)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('API call successful!');
      console.log('Generated content:', data.choices[0].message.content);
    } else {
      console.log('API call failed:', data);
    }
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
  }
}

testDeepSeekAPI();
