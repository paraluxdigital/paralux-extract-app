import type { ExtractionModeType } from '../types/extraction';

export interface PreflightEstimate {
  pageCount: number;
  mode: ExtractionModeType;
  modeName: string;
  requiredCredits: number;
  userBalance: number;
  canExecute: boolean;
  reason?: string;
}

/**
 * Fast client-side PDF page counter without heavy canvas rendering.
 * Reads the first 2MB chunk and inspects PDF catalog dictionaries.
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    // Read up to first 2MB or whole file
    const sliceSize = Math.min(file.size, 2 * 1024 * 1024);
    const arrayBuffer = await file.slice(0, sliceSize).arrayBuffer();
    const text = new TextDecoder('latin1').decode(new Uint8Array(arrayBuffer));

    // Try finding /Type /Pages /Count N
    const countMatch = text.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/i);
    if (countMatch && countMatch[1]) {
      const parsed = parseInt(countMatch[1], 10);
      if (parsed > 0 && parsed < 5000) {
        return parsed;
      }
    }

    // Fallback: match /Type /Page (excluding /Pages)
    const pageMatches = text.match(/\/Type\s*\/Page\b/gi);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }
  } catch (err) {
    console.warn('PDF preflight header parse error, falling back to 1 page:', err);
  }

  return 1;
}

/**
 * Calculates page count estimates for non-PDF inputs (images, text, markdown).
 */
export function estimateDocumentMetrics(
  inputType: 'text' | 'file',
  content: string | File | null,
  detectedPdfPages?: number
): { pageCount: number } {
  if (inputType === 'file' && content instanceof File) {
    if (content.type === 'application/pdf' || content.name.endsWith('.pdf')) {
      const pages = detectedPdfPages || 1;
      return { pageCount: pages };
    }
    // Image files (PNG, JPG, WEBP, TIFF)
    return { pageCount: 1 };
  }

  // Pasted text / markdown / CSV
  const textStr = typeof content === 'string' ? content : '';
  const wordCount = textStr.trim().split(/\s+/).filter(Boolean).length;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 500));

  return { pageCount: estimatedPages };
}

/**
 * Computes deterministic credit consumption prior to submission.
 * Rule:
 *  - Mode 1 (Standard): 1 Credit per 1-5 pages
 *  - Mode 2 (Advanced Multimodal): 2 Credits per 1-5 pages
 */
export function calculatePreflightCost(params: {
  pageCount: number;
  mode: ExtractionModeType;
  userBalance: number;
}): PreflightEstimate {
  const { pageCount, mode, userBalance } = params;

  const validPages = Math.max(1, pageCount);
  const baseRate = mode === 2 ? 2 : 1;
  const pageUnits = Math.ceil(validPages / 5);
  const requiredCredits = pageUnits * baseRate;

  const modeName = mode === 2 ? 'Advanced Multimodal' : 'Standard Extraction';
  const canExecute = userBalance >= requiredCredits;
  const reason = !canExecute
    ? `Insufficient credits. This extraction requires ${requiredCredits} ${
        requiredCredits === 1 ? 'credit' : 'credits'
      }, but your current balance is ${userBalance} ${userBalance === 1 ? 'credit' : 'credits'}.`
    : undefined;

  return {
    pageCount: validPages,
    mode,
    modeName,
    requiredCredits,
    userBalance,
    canExecute,
    reason,
  };
}
