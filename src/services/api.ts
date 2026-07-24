import type { ExtractionApiResponse } from '../types/extraction';

const PRIMARY_API_URL = '/api/extract';
const FALLBACK_API_URL = 'http://127.0.0.1:5001/paralux-digital/us-central1/extractionApi/extract';

export async function extractDocument(payload: {
  schema: Record<string, any>;
  document: string | { data: string; mimeType?: string };
  documentType?: string;
  userId?: string;
  apiKey?: string;
  model?: string;
  markupMultiplier?: number;
}): Promise<ExtractionApiResponse> {
  const body = JSON.stringify(payload);
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': payload.userId || 'web_sandbox_user',
  };

  try {
    const response = await fetch(PRIMARY_API_URL, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    return await response.json();
  } catch (primaryErr) {
    console.warn('Primary proxy API fetch failed, trying direct local backend endpoint:', primaryErr);
    const response = await fetch(FALLBACK_API_URL, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Backend responded with status ${response.status}`);
    }

    return await response.json();
  }
}
