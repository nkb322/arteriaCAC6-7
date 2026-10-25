export class ReplayAdapter {
  // Pass only a recording returned by importSession(). Its provenance is preserved.
  constructor(recording, speed = 1) {
    if (![1, 2, 4].includes(speed)) throw new Error('speed');
    this.recording = recording; this.descriptor = recording.descriptor; this.mode = 'replay'; this.speed = speed;
  }
  async start({onChunk, onEnd}) {
    this.running = true;this.paused=false;this.pausedMs=0; let index = 0;
    const samples = this.recording.samples, first = samples[0].deviceTimeMs, started = performance.now();
    const pump = () => {
      if (!this.running||this.paused) return;
      const time = (performance.now() - started-this.pausedMs) * this.speed;
      let count = 0;
      while (index < samples.length && samples[index].deviceTimeMs - first <= time && count++ < 1000) onChunk(JSON.stringify(samples[index++]) + '\n');
      if (index === samples.length) { this.running = false; onEnd(); }
      else this.timer = setTimeout(pump, 10);
    };
    this.pump=pump;this.timer = setTimeout(pump, 0);
  }
  pause(){if(!this.running||this.paused)return;this.paused=true;this.pauseTick=performance.now();clearTimeout(this.timer);}
  resume(){if(!this.running||!this.paused)return;this.pausedMs+=performance.now()-this.pauseTick;this.paused=false;this.timer=setTimeout(this.pump,0);}
  async stop() { this.running = false; clearTimeout(this.timer); }
}
