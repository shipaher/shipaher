export const config = {
  runtime: 'edge' // Sử dụng Edge Runtime để hỗ trợ phản hồi Streaming nhanh nhất
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { text, targetLanguage } = body;

    const prompt = `Dịch sang ${targetLanguage} và kèm Pinyin.\nNguyên văn: "${text}"\nTrả lời ngắn gọn đúng 2 dòng:\nPinyin: ...\nDịch: ...`;

    // Gọi đến API thật của xkiro
    const response = await fetch("https://api.xkiro.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Gắn API Key ở đây, trình duyệt người dùng sẽ không bao giờ nhìn thấy
        'Authorization': `Bearer sk-xt-392d4fc7a9049a5a6dc1f36d9ab150dff32c16d7c764514c` 
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v4-flash",
        stream: true, 
        messages: [
          { role: 'system', content: 'You are a fast translation API.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "API upstream error" }), { status: response.status });
    }

    // Trả lại luồng dữ liệu (stream) nguyên vẹn về cho giao diện
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
