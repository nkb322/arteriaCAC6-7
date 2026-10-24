import {LIMITS} from './schema.js';
// Bounded newline JSON decoder for app interchange/replay. Hardware may supply another decoder.
export class FrameParser {
  constructor(onFrame, onError) { this.onFrame = onFrame; this.onError = onError; this.buffer = ''; this.bytes = 0; this.discarding = false; this.decoder = new TextDecoder('utf-8', {fatal: true}); }
  push(chunk) {
    let text;
    try { text = typeof chunk === 'string' ? chunk : this.decoder.decode(chunk, {stream: true}); }
    catch { this.reset(); this.onError('encoding'); return; }
    for (const character of text) {
      if (character === '\n') {
        if (!this.discarding && this.buffer.trim()) {
          try { this.onFrame(JSON.parse(this.buffer)); } catch { this.onError('json'); }
        }
        this.buffer = ''; this.bytes = 0; this.discarding = false;
      } else if (!this.discarding) {
        this.buffer += character;
        const point = character.codePointAt(0);
        this.bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
        if (this.bytes > LIMITS.frameBytes) { this.buffer = ''; this.bytes = 0; this.discarding = true; this.onError('frameSize'); }
      }
    }
  }
  finish() {
    try { this.decoder.decode(); } catch { this.onError('encoding'); }
    if (this.buffer.trim() && !this.discarding) this.onError('truncated');
    this.reset();
  }
  reset() { this.buffer = ''; this.bytes = 0; this.discarding = false; this.decoder = new TextDecoder('utf-8', {fatal: true}); }
}
