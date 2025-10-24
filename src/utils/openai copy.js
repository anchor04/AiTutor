// import { API_URL } from '@env'; 
const API_URL = 'http://192.168.1.164:3000';

export const sendToOpenAI = async (query) => {
  try {
    // Build payload for your backend
    const payload = {
      text: 'Provide a detailed step-by-step solution:',
      imageUrl: `data:${query.mime};base64,${query.data}`, // your base64 image
    };

    // Call your backend /analyze endpoint
    const res = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Backend error: ${res.status}`);
    }

    const data = await res.json();
 // Extract the actual JSON array string from OpenAI’s response
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Unexpected API response structure');
    }

    // Parse the content (it's a JSON string, not a JS object)
    let steps;
    try {
      steps = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse JSON from assistant:', content);
      throw new Error('Invalid JSON returned by model');
    }

    return steps; // array of steps
  } catch (error) {
    console.error('sendToOpenAI error:', error);
    throw error;
  }
};
