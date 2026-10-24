export const SIMULATION_DESCRIPTOR = Object.freeze({schemaVersion: 1, origin: 'simulated', deviceId: 'arteria-simulator', deviceName: 'Arteria simulator', sampleRateHz: 25,
  channels: [{id: 'optical', label: 'Synthetic optical signal', unit: 'a.u.', min: 0, max: 4095}]});
export function simulatedSample(sequence, scenario = 'clean') {
  const t = sequence / 25;
  let value = Math.round(2000 + 280 * Math.sin(2 * Math.PI * 1.2 * t) + 65 * Math.sin(2 * Math.PI * 2.4 * t));
  if (scenario === 'flatline' && t >= 3) value = 2000;
  if (scenario === 'clipping' && t >= 3 && sequence % 5 < 2) value = 4095;
  return {sequence, deviceTimeMs: sequence * 40, raw: {optical: value}};
}
export class SimulationAdapter {
  constructor(scenario = 'clean') { this.scenario = scenario; this.descriptor = SIMULATION_DESCRIPTOR; this.mode = 'stream'; }
  async start({onChunk}) {
    this.sequence = 0;
    this.timer = setInterval(() => {
      const i = this.sequence++;
      if (this.scenario === 'dropout' && i >= 75 && i < 150) return;
      if (this.scenario === 'malformed' && i % 37 === 15) { onChunk('{invalid}\n'); return; }
      const line = JSON.stringify(simulatedSample(i, this.scenario)) + '\n';
      // Deliberately split frames so simulation exercises framing as well as validation.
      const middle = Math.floor(line.length / 2); onChunk(line.slice(0, middle)); onChunk(line.slice(middle));
    }, 40);
  }
  async stop() { clearInterval(this.timer); }
}
