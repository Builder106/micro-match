export {};

const endpoint = process.env.LIBRETRANSLATE_ENDPOINT?.replace(/\/+$/, '');
const apiKey = process.env.LIBRETRANSLATE_API_KEY;

if (!endpoint || !apiKey) {
  throw new Error('Set LIBRETRANSLATE_ENDPOINT and LIBRETRANSLATE_API_KEY before running this check.');
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

const healthResponse = await fetch(`${endpoint}/health`);
const health = await readJson(healthResponse);
if (!healthResponse.ok || typeof health !== 'object' || health === null || !('status' in health) || health.status !== 'ok') {
  throw new Error(`LibreTranslate health check failed with HTTP ${healthResponse.status}.`);
}

const translationResponse = await fetch(`${endpoint}/translate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    q: 'Hello from MicroMatch',
    source: 'auto',
    target: 'es',
    format: 'text',
    api_key: apiKey
  })
});
const translation = await readJson(translationResponse);
if (
  !translationResponse.ok ||
  typeof translation !== 'object' ||
  translation === null ||
  !('translatedText' in translation) ||
  typeof translation.translatedText !== 'string' ||
  !translation.translatedText.trim()
) {
  throw new Error(`Authenticated translation check failed with HTTP ${translationResponse.status}.`);
}

const unauthenticatedResponse = await fetch(`${endpoint}/translate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    q: 'Hello from MicroMatch',
    source: 'auto',
    target: 'es',
    format: 'text'
  })
});
if (![401, 403, 429].includes(unauthenticatedResponse.status)) {
  throw new Error(`Unauthenticated request was not rejected; received HTTP ${unauthenticatedResponse.status}.`);
}

console.log('LibreTranslate health, authenticated translation, and API-key rejection checks passed.');
