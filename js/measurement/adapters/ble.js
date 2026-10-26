import {validateHardwareConfig} from './hardware-config.js';

export class BluetoothAdapter {
  constructor(config, bluetooth=globalThis.navigator?.bluetooth){this.config=validateHardwareConfig(config,'ble');this.bluetooth=bluetooth;this.descriptor=this.config.descriptor;this.mode='stream';this.device=null;this.characteristic=null;this.connectedName=null;this.onDisconnect=()=>{if(this.callbacks)this.callbacks.onError?.(new Error('disconnected'));else globalThis.document?.dispatchEvent(new Event('arteria-device-disconnected'));};}
  get isConnected(){return !!this.device?.gatt?.connected&&!!this.characteristic;}
  async connect(){
    if(!this.bluetooth?.requestDevice)throw new Error('bluetoothUnavailable');
    const {serviceUUID,characteristicUUID}=this.config.ble;
    this.device=await this.bluetooth.requestDevice({filters:[{services:[serviceUUID]}]});
    try{
      this.device.addEventListener('gattserverdisconnected',this.onDisconnect);
      const server=await this.device.gatt.connect();
      const service=await server.getPrimaryService(serviceUUID);
      this.characteristic=await service.getCharacteristic(characteristicUUID);
      if(!this.characteristic.startNotifications||!this.characteristic.addEventListener)throw new Error('bluetoothNotifications');
      this.connectedName=this.device.name||this.descriptor.deviceName;return {deviceName:this.connectedName,deviceId:this.descriptor.deviceId};
    }catch(error){await this.disconnect();throw error;}
  }
  async start({onChunk,onEnd,onError}){
    if(!this.device||!this.characteristic)throw new Error('notConnected');
    this.callbacks={onChunk,onEnd,onError};
    // MeasurementController owns the shared decoder/parser. Adapters only transport bytes.
    this.onValue=event=>{const view=event.target?.value;if(!view)return;onChunk(new Uint8Array(view.buffer,view.byteOffset,view.byteLength));};
    this.characteristic.addEventListener('characteristicvaluechanged',this.onValue);
    await this.characteristic.startNotifications();
  }
  async stop(){if(this.characteristic&&this.onValue)this.characteristic.removeEventListener('characteristicvaluechanged',this.onValue);this.callbacks=null;await this.disconnect();}
  async disconnect(){
    if(this.device)this.device.removeEventListener('gattserverdisconnected',this.onDisconnect);
    try{if(this.characteristic?.stopNotifications)await this.characteristic.stopNotifications();}catch{}
    try{if(this.device?.gatt?.connected)this.device.gatt.disconnect();}catch{}
    this.device=null;this.characteristic=null;this.connectedName=null;
  }
}
