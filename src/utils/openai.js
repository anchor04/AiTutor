// import { API_URL } from '@env';
const API_URL = 'http://192.168.1.164:3000';

export const sendToOpenAI = async (query) => {
  try {
    const payload = {
      text: 'Provide a detailed step-by-step solution:',
      imageUrl: `data:${query.mime};base64,${query.data}`,
    };

    const res = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Handle backend/network errors
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || `Backend error: ${res.status}`);
    }

    const data = await res.json();

    // Validate backend structure
    if (!data.success) {
      console.warn('⚠️ AI analysis failed:', data.message);
      throw new Error(data.message || 'AI analysis failed');
    }

    // Return structured data directly from backend
    return {
      steps: data.steps || [],
      finalAnswer: data.finalAnswer ?? null,
      rawText: data.rawText || '',
    };
  } catch (error) {
    console.error('sendToOpenAI error:', error);
    throw error;
  }
};
