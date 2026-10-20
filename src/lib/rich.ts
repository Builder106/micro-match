// Translated sentences keep their inline links and code as tags, so a translator can move them:
// "Read <docs>the guide</docs> first." splits into plain text and one tagged piece.
export type RichPart = { tag: string | null; text: string };

export function richParts(message: string): RichPart[] {
  const parts: RichPart[] = [];
  const re = /<([a-z]+)>(.*?)<\/\1>/g;
  let last = 0;
  for (const match of message.matchAll(re)) {
    if (match.index > last) parts.push({ tag: null, text: message.slice(last, match.index) });
    parts.push({ tag: match[1], text: match[2] });
    last = match.index + match[0].length;
  }
  if (last < message.length) parts.push({ tag: null, text: message.slice(last) });
  return parts;
}
