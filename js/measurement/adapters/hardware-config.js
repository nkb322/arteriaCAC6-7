import {validateDescriptor} from '../schema.js';

const uuid=value=>typeof value==='string'&&(/^[0-9a-f]{4,8}$/i.test(value)||/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));

// Configuration describes the documented Arteria NDJSON reference stream. It
// does not assert that any particular wearable implements this protocol.
export function validateHardwareConfig(value, expectedTransport) {
  if(!value||typeof value!=='object'||Array.isArray(value)||value.schemaVersion!==1||!['ble','serial'].includes(value.transport)||expectedTransport&&value.transport!==expectedTransport)throw new Error('hardwareConfig');
  const descriptor=validateDescriptor(value.descriptor);
  if(descriptor.origin!=='hardware')throw new Error('hardwareConfig');
  const config={schemaVersion:1,transport:value.transport,descriptor};
  if(value.transport==='ble'){
    if(!uuid(value.ble?.serviceUUID)||!uuid(value.ble?.characteristicUUID))throw new Error('hardwareConfig');
    config.ble={serviceUUID:value.ble.serviceUUID,characteristicUUID:value.ble.characteristicUUID};
  } else {
    const baudRate=value.serial?.baudRate;
    if(!Number.isInteger(baudRate)||baudRate<300||baudRate>2_000_000)throw new Error('hardwareConfig');
    config.serial={baudRate};
  }
  return config;
}
