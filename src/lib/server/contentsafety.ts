// Minimal Azure AI Content Safety text moderation helper with safe fallbacks.
import { env } from '$env/dynamic/private';

export type ModerationCategory = 'Hate' | 'SelfHarm' | 'Sexual' | 'Violence';

export type ModerationResult = {
  blocked: boolean;
  reasons: Array<{ category: ModerationCategory | string; severity: number }>;
  raw?: unknown;
};

const DEFAULT_CATEGORIES: ModerationCategory[] = ['Hate', 'SelfHarm', 'Sexual', 'Violence'];

export async function moderateText(text: string, categories: ModerationCategory[] = DEFAULT_CATEGORIES): Promise<ModerationResult> {
  const endpoint = env.AZURE_CONTENT_SAFETY_ENDPOINT;
  const apiKey = env.AZURE_CONTENT_SAFETY_KEY;

  if (!text || text.trim().length === 0) {
    return { blocked: false, reasons: [] };
  }

  if (!endpoint || !apiKey) {
    // Fallback: treat as safe when not configured
    return { blocked: false, reasons: [] };
  }

  try {
    const url = `${endpoint.replace(/\/$/, '')}/contentsafety/text:analyze?api-version=2024-09-01`; // tolerate trailing slash
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey
      },
      body: JSON.stringify({
        text,
        categories,
        outputType: 'EightSeverityLevels'
      })
    });

    if (!res.ok) {
      // Graceful fallback on API error
      return { blocked: false, reasons: [] };
    }

    interface SafetyCategory {
      category?: string;
      severity?: number;
    }
    interface SafetyResponse {
      categoriesAnalysis?: SafetyCategory[];
      categories?: SafetyCategory[];
    }
    const data = (await res.json()) as SafetyResponse;

    // Normalize categories array (API response shape can vary by version)
    const items: Array<{ category: string; severity: number }> =
      (data?.categoriesAnalysis || data?.categories || []).map((c) => ({
        category: String(c.category ?? ''),
        severity: Number(c.severity ?? 0)
      }));

    const reasons = items
      .filter(Boolean)
      .map((c) => ({ category: String(c.category), severity: Number(c.severity) }))
      .filter((c) => !Number.isNaN(c.severity));

    // Block if any category reaches medium+ severity. Using 8-level scale: >=4 considered concerning.
    const blocked = reasons.some((r) => r.severity >= 4);
    return { blocked, reasons, raw: data };
  } catch {
    // Fail-open: do not block content if service fails
    return { blocked: false, reasons: [] };
  }
}

