import type { ExtractionApiResponse } from '../types/extraction';

const PRIMARY_API_URL = '/api/extract';
const DEV_FALLBACK_API_URL = 'http://127.0.0.1:5001/paralux-digital/us-central1/extractionApi/extract';
const PROD_FALLBACK_API_URL = 'https://us-central1-paralux-digital.cloudfunctions.net/extractionApi/extract';

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

    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Primary rewrite failed, fallback to direct Cloud Function URL
  }

  const fallbackUrl =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? DEV_FALLBACK_API_URL
      : PROD_FALLBACK_API_URL;

  const response = await fetch(fallbackUrl, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Extraction API responded with status ${response.status}`);
  }

  return await response.json();
}
