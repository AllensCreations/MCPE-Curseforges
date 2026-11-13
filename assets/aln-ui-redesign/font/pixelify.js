// Pixelify Sans glyph mapper (page F0). Spaces and section-sign color codes stay vanilla.
const PAGE = 0x00F0;
export function pixelify(text) {
  let out = "";
  for (const ch of String(text)) {
    const c = ch.codePointAt(0);
    out += c > 0x20 && c < 0x7F ? String.fromCharCode(PAGE + c) : ch;
  }
  return out;
}
