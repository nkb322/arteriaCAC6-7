import {validateHardwareConfig} from './hardware-config.js';

export class SerialAdapter {
  constructor(config, serial=globalThis.navigator?.serial){this.config=validateHardwareConfig(config,'serial');this.serial=serial;this.descriptor=this.config.descriptor;this.mode='stream';this.port=null;this.reader=null;this.stopped=false;this.onDisconnect=event=>{if(event?.port&&event.port!==this.port)return;if(this.callbacks)this.callbacks.onError?.(new Error('disconnected'));else globalThis.document?.dispatchEvent(new Event('arteria-device-disconnected'));};}
  get isConnected(){return !!this.port;}
  async connect(){
    if(!this.serial?.requestPort)throw new Error('serialUnavailable');
    this.port=await this.serial.requestPort();
    try{await this.port.open({baudRate:this.config.serial.baudRate});this.serial.addEventListener?.('disconnect',this.onDisconnect);return{deviceName:this.descriptor.deviceName,deviceId:this.descriptor.deviceId};}
    catch(error){try{await this.port.close();}catch{}this.port=null;throw error;}
  }
  async start({onChunk,onEnd,onError}){
    if(!this.port?.readable)throw new Error('notConnected');
    this.callbacks={onChunk,onEnd,onError};this.stopped=false;this.reader=this.port.readable.getReader();
    // MeasurementController owns the shared decoder/parser. Adapters only transport bytes.
    this.readLoop=async()=>{try{while(!this.stopped){const {value,done}=await this.reader.read();if(done)break;if(value)onChunk(value);}if(!this.stopped)onEnd();}catch(error){if(!this.stopped)onError(error);}finally{try{this.reader?.releaseLock();}catch{}this.reader=null;}};
    void this.readLoop();
  }
  async stop(){this.stopped=true;try{await this.reader?.cancel();}catch{}try{await this.readLoop;}catch{}this.reader=null;this.callbacks=null;if(this.port){this.serial.removeEventListener?.('disconnect',this.onDisconnect);try{await this.port.close();}catch{}this.port=null;}}
  async disconnect(){await this.stop();}
}
