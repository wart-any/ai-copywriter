export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, style, userId } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: '参数不完整' });
  }

  // 先注释掉 KV 相关代码，验证接口是否能正常调用豆包
  // const today = new Date().toISOString().split('T')[0];
  // const key = `usage:${userId}:${today}`;
  // let count = await kv.get(key) || 0;
  const count = 0; // 临时用 0 代替
  const freeLimit = 3;

  if (count >= freeLimit) {
    return res.status(403).json({
      error: '今日免费次数已用完',
      needPay: true,
      message: '您今天已免费生成3次文案，继续使用需要付费。'
    });
  }

  try {
    const API_KEY = process.env.DOUBAO_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: '服务器配置错误' });
    }

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'ep-20260215233522-2xcrv', // 这里是你的模型ID
        messages: [
          {
            role: 'user',
            content: `${prompt}，风格要求：${style || '正常'}`
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'AI调用失败' });
    }

    const copy = data.choices?.[0]?.message?.content || '生成失败';

    // await kv.incr(key); // 先注释掉

    return res.status(200).json({
      copy,
      remaining: freeLimit - (count + 1),
      total: freeLimit
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}