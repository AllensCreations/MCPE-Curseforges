const PAGE = 0xF000;

export function pixelify(text) {
  let out = "";
  for (const ch of String(text)) {
    const c = ch.codePointAt(0);
    out += c > 0x20 && c < 0x7F ? String.fromCharCode(PAGE + c) : ch;
  }
  return out;
}
