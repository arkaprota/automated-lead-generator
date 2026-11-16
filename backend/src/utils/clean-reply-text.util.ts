/**
 * Strips quoted history, signatures, and HTML from an inbound email reply
 * before it is sent to the LLM for classification (Rule 12 — trim inputs).
 *
 * Returns only the new, fresh portion of the reply.
 */
export function cleanReplyText(raw: string): string {
  let text = raw;

  // 1. Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // 2. Remove lines that start common quote markers (>, |, wrote:)
  const lines = text.split('\n');
  const freshLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Stop at a quoted-history separator
    if (
      trimmed.startsWith('>') ||
      trimmed.startsWith('|') ||
      /^On .{5,} wrote:/i.test(trimmed) ||
      /^-{3,}Original Message-{3,}/i.test(trimmed) ||
      /^_{3,}/.test(trimmed) ||
      /^From:\s/.test(trimmed) ||
      /^Sent:\s/.test(trimmed)
    ) {
      break;
    }
    freshLines.push(line);
  }
  text = freshLines.join('\n');

  // 3. Remove common email signature patterns
  text = text
    .replace(/^(Best regards|Kind regards|Regards|Thanks|Thank you|Cheers|Sincerely)[,\n].*/ms, '')
    .replace(/^--\s*\n.*/ms, '');

  // 4. Collapse whitespace
  return text.replace(/\s+/g, ' ').trim().slice(0, 2000); // hard cap: 2000 chars
}
