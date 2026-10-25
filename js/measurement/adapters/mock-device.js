import {SIMULATION_DESCRIPTOR, simulatedSample} from './simulation.js';
// A lifecycle test double using the APP interchange schema, not a device protocol.
export class MockDeviceAdapter {
  constructor() { this.descriptor={...SIMULATION_DESCRIPTOR,deviceId:'mock-device',deviceName:'Mock device (synthetic)'};this.mode='stream'; }
  async start({onChunk,onError}) {
    this.cancelled=false;
    await new Promise(resolve=>{this.releaseConnect=resolve;this.connectTimer=setTimeout(resolve,250);});
    if(this.cancelled)return;
    let sequence=0;
    this.timer=setInterval(()=>{
      const sample=simulatedSample(sequence++),line=JSON.stringify(sample)+'\n';
      onChunk(line.slice(0,13));onChunk(line.slice(13));
      if(sequence%19===0)onChunk(line); // duplicate
      if(sequence%37===0)onChunk('{broken}\n');
      if(sequence===100){clearInterval(this.timer);onError(new Error('mock disconnect'));}
    },40);
  }
  async stop(){this.cancelled=true;clearInterval(this.timer);clearTimeout(this.connectTimer);this.releaseConnect?.();}
}
