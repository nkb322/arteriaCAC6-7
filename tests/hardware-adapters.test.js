import test from 'node:test';
import assert from 'node:assert/strict';
import {BluetoothAdapter} from '../js/measurement/adapters/ble.js';
import {SerialAdapter} from '../js/measurement/adapters/serial.js';
import {validateHardwareConfig} from '../js/measurement/adapters/hardware-config.js';
import {FrameParser} from '../js/measurement/parser.js';

const config=(transport='serial')=>({schemaVersion:1,transport,descriptor:{schemaVersion:1,origin:'hardware',deviceId:'board-01',deviceName:'Reference board',sampleRateHz:25,channels:[{id:'optical',label:'Optical signal',unit:'a.u.',min:0,max:4095}]},...(transport==='ble'?{ble:{serviceUUID:'1234',characteristicUUID:'abcd'}}:{serial:{baudRate:115200}})});
const line=new TextEncoder().encode(JSON.stringify({sequence:0,deviceTimeMs:0,raw:{optical:2000}})+'\n');
class Emitter{constructor(){this.listeners=new Map();}addEventListener(k,v){if(!this.listeners.has(k))this.listeners.set(k,new Set());this.listeners.get(k).add(v);}removeEventListener(k,v){this.listeners.get(k)?.delete(v);}emit(k,event={}){for(const listener of this.listeners.get(k)||[])listener(event);}}

test('hardware configuration is explicit, versioned and validates transport metadata',()=>{
  assert.equal(validateHardwareConfig(config()).descriptor.origin,'hardware');
  assert.throws(()=>validateHardwareConfig({...config(),descriptor:{...config().descriptor,origin:'simulated'}}),/hardwareConfig/);
  assert.throws(()=>validateHardwareConfig({...config('ble'),ble:{serviceUUID:'invented',characteristicUUID:'bad uuid'}}),/hardwareConfig/);
  assert.throws(()=>validateHardwareConfig({...config(),serial:{baudRate:0}}),/hardwareConfig/);
});

test('Bluetooth adapter requests only configured GATT service and streams notifications through the parser',async()=>{
  const char=new Emitter();char.startNotifications=async()=>{char.started=true;return char;};char.stopNotifications=async()=>{};
  const device=new Emitter();device.name='Board from browser';device.id='private-browser-id';device.gatt={connected:false,connect:async()=>{device.gatt.connected=true;return{getPrimaryService:async uuid=>{assert.equal(uuid,'1234');return{getCharacteristic:async value=>{assert.equal(value,'abcd');return char;}};}};},disconnect(){device.gatt.connected=false;}};
  let request;const adapter=new BluetoothAdapter(config('ble'),{requestDevice:async options=>{request=options;return device;}});await adapter.connect();assert.deepEqual(request.filters,[{services:['1234']}]);assert.equal(adapter.isConnected,true);
  const received=[],errors=[],parser=new FrameParser(value=>received.push(value),reason=>errors.push(reason));await adapter.start({onChunk:value=>parser.push(value),onEnd(){},onError:error=>errors.push(error)});const bytes=line.buffer.slice(line.byteOffset,line.byteOffset+line.byteLength);char.value=new DataView(bytes);char.emit('characteristicvaluechanged',{target:char});
  assert.deepEqual(received,[{sequence:0,deviceTimeMs:0,raw:{optical:2000}}]);assert.deepEqual(errors,[]);assert.equal(adapter.connectedName,'Board from browser');await adapter.stop();assert.equal(adapter.isConnected,false);assert.equal(char.listeners.get('characteristicvaluechanged').size,0);
});

test('Bluetooth unexpected disconnection reports source failure and unsupported API is explicit',async()=>{
  const device=new Emitter();device.gatt={connected:true,connect:async()=>({getPrimaryService:async()=>({getCharacteristic:async()=>{const c=new Emitter();c.startNotifications=async()=>{};return c;}})}),disconnect(){device.gatt.connected=false;}};
  const adapter=new BluetoothAdapter(config('ble'),{requestDevice:async()=>device});await adapter.connect();let failed=false;await adapter.start({onChunk(){},onEnd(){},onError(){failed=true;}});device.emit('gattserverdisconnected');assert.equal(failed,true);await adapter.stop();
  await assert.rejects(new BluetoothAdapter(config('ble'),{}).connect(),/bluetoothUnavailable/);
});

test('serial adapter opens the selected port, streams bytes and closes on cancellation',async()=>{
  let controller,settings=null,closed=false;const stream=new ReadableStream({start(value){controller=value;}});const port=new Emitter();port.readable=stream;port.open=async value=>{settings=value;};port.close=async()=>{closed=true;};const serial=new Emitter();serial.requestPort=async()=>port;const adapter=new SerialAdapter(config(),serial);await adapter.connect();assert.deepEqual(settings,{baudRate:115200});
  const received=[],errors=[],parser=new FrameParser(value=>received.push(value),reason=>errors.push(reason));await adapter.start({onChunk:value=>parser.push(value),onEnd(){},onError:error=>errors.push(error)});controller.enqueue(line);await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(received,[{sequence:0,deviceTimeMs:0,raw:{optical:2000}}]);await adapter.stop();assert.equal(closed,true);assert.deepEqual(errors,[]);assert.equal(adapter.isConnected,false);assert.equal(serial.listeners.get('disconnect').size,0);
});

test('serial unplug events are filtered by selected port and surfaced to the active stream',async()=>{
  const port=new Emitter();port.readable=new ReadableStream({start(){}});port.open=async()=>{};port.close=async()=>{};const serial=new Emitter();serial.requestPort=async()=>port;const adapter=new SerialAdapter(config(),serial);await adapter.connect();let failures=0;await adapter.start({onChunk(){},onEnd(){},onError(){failures++;}});serial.emit('disconnect',{port:{}});assert.equal(failures,0);serial.emit('disconnect',{port});assert.equal(failures,1);await adapter.stop();
});

test('serial API absence and failed port open return clear failures',async()=>{
  await assert.rejects(new SerialAdapter(config(),{}).connect(),/serialUnavailable/);const port={open:async()=>{throw Error('permission');},close:async()=>{}};await assert.rejects(new SerialAdapter(config(),{requestPort:async()=>port}).connect(),/permission/);
});
