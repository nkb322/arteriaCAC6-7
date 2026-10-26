import test from 'node:test';
import assert from 'node:assert/strict';
import {PRODUCT_KNOWLEDGE,PRODUCT_KNOWLEDGE_VERSION,verifiedProductAnswer} from '../js/care/product-knowledge.js';
import {createHandler} from '../netlify/functions/care-chat.mjs';

test('versioned product reference documents actual local storage, consented transmission, and unavailable features',()=>{
 assert.equal(PRODUCT_KNOWLEDGE_VERSION,'1.0.0');
 assert.match(PRODUCT_KNOWLEDGE.privacy.ai,/configured external AI provider/);
 assert.match(PRODUCT_KNOWLEDGE.privacy.ai,/Raw samples, notes and profile details are excluded/);
 assert.match(PRODUCT_KNOWLEDGE.privacy.ai,/cannot promise provider-side retention/);
 assert.match(PRODUCT_KNOWLEDGE.recording.storage,/IndexedDB/);
 for(const feature of ['cloud account or sync','CSV import','Bluetooth'])assert.ok(PRODUCT_KNOWLEDGE.capabilities.unsupported.some(x=>x.toLowerCase().includes(feature.toLowerCase()))||PRODUCT_KNOWLEDGE.capabilities.hardware.toLowerCase().includes(feature.toLowerCase()));
});

test('English and Spanish navigation, export, privacy, hardware, and signal answers are deterministic',()=>{
 for(const [q,language,terms] of [
  ['Where do I export a CSV?', 'en', ['My trends','Export CSV','not be imported']],
  ['Where can I find Profile & Settings?', 'en', ['Profile & Settings','local-data settings']],
  ['Does my data leave the device?', 'en', ['external AI provider','separate session-sharing consent','cannot promise provider-side retention']],
  ['Is a Bluetooth sensor connected?', 'en', ['No physical hardware','Bluetooth']],
  ['What does a timing gap mean?', 'en', ['1.8 times','not a clinical']],
  ['¿Dónde veo mis sesiones?', 'es', ['Mis tendencias','Compartir de forma segura']],
  ['¿Qué datos se envían a la IA?', 'es', ['Privacidad verificada','consentimiento separado']],
  ['¿Hay un sensor Bluetooth conectado?', 'es', ['No hay hardware físico','Bluetooth']]
 ]) {const answer=verifiedProductAnswer(q,language);assert.ok(answer,q);for(const term of terms)assert.ok(answer.toLowerCase().includes(term.toLowerCase()),`${q} missing ${term}`);}
});

test('recording workflow directions stay deterministic while recording interpretation stays behind consent',()=>{
 assert.match(verifiedProductAnswer('How do I save that recording?','en'),/Photon acquisition.*Start acquisition.*Stop & save/);
 assert.match(verifiedProductAnswer('¿Cómo guardo esta grabación?','es'),/Adquisición Photon.*Iniciar adquisición.*Detener y guardar/);
 assert.match(verifiedProductAnswer('How do I export this recording?','en'),/My trends.*Export CSV or Export JSON/);
 assert.match(verifiedProductAnswer('What does my recording mean?','en'),/select it in Care Companion/);
 assert.equal(verifiedProductAnswer('What does my recording mean?','en',{sessionShared:true}),null);
 assert.match(verifiedProductAnswer('¿Qué significa esta grabación?','es'),/aceptas por separado/);
 assert.equal(verifiedProductAnswer('What is DVT?','en'),null);
});

test('server returns critical product facts without invoking Groq',async()=>{
 let calls=0;
 const handler=createHandler({env:{ARTERIA_AI_ENABLED:'true',GROQ_API_KEY:'TEST-ONLY'},fetchImpl:async()=>{calls++;throw Error('must not call model');}});
 const request=text=>new Request('https://arteria.example/api/care-chat',{method:'POST',headers:{origin:'https://arteria.example','content-type':'application/json'},body:JSON.stringify({language:'en',messages:[{role:'user',content:text}]})});
 for(const q of ['Where do I export CSV?','Does my data leave the device?','How do I start a measurement?','How do I save that recording?','Is a Bluetooth sensor connected?','What does my recording mean?']){const response=await handler(request(q));assert.equal(response.status,200);assert.equal((await response.json()).kind,'product');}
 assert.equal(calls,0);
});
