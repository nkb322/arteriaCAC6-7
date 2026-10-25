import {savedSessions} from '../measurement/ui.js';
import {sessionSummary} from './session-summary.js';
import {urgentConcern,urgentMessage} from './safety.js';
import {conversationBody} from './request.js';
import {loadPreferences,initials} from '../profile/preferences.js';
const $=id=>document.getElementById(id);
const copy={en:{check:'Check availability',privacy:"AI messages are sent to the configured external provider. Don't include identifying or sensitive information. Recordings stay on this device unless you explicitly share a summary.",consent:'I agree to send my messages and recent chat context to the AI provider for this conversation.',context:'Explain a saved recording (optional)',selectSession:'Choose a recording to review',sessionConsent:'Include this reviewed summary in this conversation. Raw samples, notes and profile details are excluded. Review labels before sharing.',remove:'Remove summary & clear conversation',stop:'Stop response',offlineHelp:'Open offline app guide',available:'AI enabled',unavailable:'AI unavailable · offline guide available',checking:'Checking AI availability…',thinking:'Aria is preparing a reply…',needConsent:'Before sending, agree to share your messages with the AI provider. You can also use the offline app guide.',notSent:'AI is unavailable. Your message was not sent to a model. Use the offline app guide or check availability.',failed:'The AI service could not complete this request. No model reply is being substituted. Try again or use the offline guide.',rate:'The AI service is busy or has reached its request limit. Please try later.',stopped:'Response stopped. The provider may already have received the request.',cleared:'Conversation cleared on this device. This cannot remove data already sent to a provider.',welcome:'Hi, I’m Aria. I can help you explore Arteria and understand recording quality. AI needs a configured service and your consent. For medical questions, consult your care team.',none:'No recording shared',sample:'SIMULATED',hardware:'HARDWARE · declared source',replay:'REPLAY',summary:'Summary to share',seconds:'seconds',samples:'accepted samples',gaps:'missing samples / timing gaps',ai:'AI response',safety:'Safety guidance · not AI',local:'Offline guide · not AI',you:'You',guide:'Photon records sample data or replays a saved recording. Start a 10-second demo to see the waveform. My trends keeps dated sessions, comparisons, notes and exports. Profile & Settings controls recording duration, chart display and local privacy. Reports and history are unencrypted; the separate encrypted-note download uses a passphrase. No physical device or diagnostic model is configured.',shared:'A recording summary is selected. Review it and tick the separate sharing consent before sending.',invalid:'This session summary could not be prepared. Nothing was shared.',aiFoot:'AI may be inaccurate. No diagnosis, treatment advice or risk prediction. Conversation context stays in memory; messages you send leave this device.'},es:{check:'Comprobar disponibilidad',privacy:'Los mensajes de IA se envían al proveedor externo configurado. No incluyas datos identificativos o sensibles. Las grabaciones permanecen en este dispositivo salvo que compartas un resumen explícitamente.',consent:'Acepto enviar mis mensajes y el contexto reciente de esta conversación al proveedor de IA.',context:'Explicar una grabación guardada (opcional)',selectSession:'Elige una grabación para revisarla',sessionConsent:'Incluir este resumen revisado en la conversación. Se excluyen muestras originales, notas y datos del perfil. Revisa las etiquetas antes de compartir.',remove:'Quitar resumen y borrar conversación',stop:'Detener respuesta',offlineHelp:'Abrir guía local de la aplicación',available:'IA habilitada',unavailable:'IA no disponible · guía local disponible',checking:'Comprobando la disponibilidad de IA…',thinking:'Aria está preparando una respuesta…',needConsent:'Antes de enviar, acepta compartir los mensajes con el proveedor de IA. También puedes usar la guía local.',notSent:'La IA no está disponible. Tu mensaje no se envió a un modelo. Usa la guía local o comprueba la disponibilidad.',failed:'El servicio de IA no pudo completar la solicitud. No se sustituye por una respuesta predefinida. Reintenta o usa la guía local.',rate:'El servicio de IA está ocupado o alcanzó su límite. Inténtalo más tarde.',stopped:'Respuesta detenida. El proveedor puede haber recibido la solicitud.',cleared:'Conversación borrada en este dispositivo. Esto no elimina datos ya enviados al proveedor.',welcome:'Hola, soy Aria. Puedo ayudarte a explorar Arteria y comprender la calidad de las grabaciones. La IA necesita un servicio configurado y tu consentimiento. Consulta a tu equipo médico para preguntas de salud.',none:'Sin grabación compartida',sample:'SIMULADO',hardware:'HARDWARE · origen declarado',replay:'REPRODUCCIÓN',summary:'Resumen que se compartirá',seconds:'segundos',samples:'muestras aceptadas',gaps:'muestras faltantes / intervalos ausentes',ai:'Respuesta de IA',safety:'Orientación de seguridad · no es IA',local:'Guía local · no es IA',you:'Tú',guide:'Photon graba datos de ejemplo o reproduce una grabación. Inicia una demostración de 10 segundos para ver la señal. Mis tendencias conserva sesiones con fechas, comparaciones, notas y exportaciones. Perfil y ajustes controla la duración, los gráficos y la privacidad local. El historial y los informes no están cifrados; la descarga de nota cifrada usa una frase de contraseña. No hay dispositivo físico ni modelo diagnóstico configurado.',shared:'Hay un resumen seleccionado. Revísalo y marca el consentimiento de datos antes de enviarlo.',invalid:'No se pudo preparar el resumen. No se compartieron datos.',aiFoot:'La IA puede equivocarse. No ofrece diagnósticos, tratamientos ni predicciones de riesgo. El contexto se mantiene en memoria; los mensajes enviados salen de este dispositivo.'}};
const language=()=>document.documentElement.lang==='es'?'es':'en',t=key=>copy[language()][key];
let available=null,provider='',checked=false,history=[],request=null,generation=0,summary=null,sessionSignature='',statusKey='',contextId='';
function status(key){statusKey=key;$('care-request-status').textContent=key?t(key):'';}
function append(text,kind='local'){
 const message=document.createElement('div');message.className=`chat-message ${kind==='user'?'user-message':'aria-message'}`;
 const avatar=document.createElement('div');avatar.className='message-avatar';avatar.setAttribute('aria-hidden','true');avatar.textContent=kind==='user'?initials(loadPreferences().displayName||t('you')):'A';
 const body=document.createElement('div'),meta=document.createElement('div'),bubble=document.createElement('div');body.className='message-content';meta.className='message-meta';meta.textContent=kind==='user'?t('you'):kind==='ai'?t('ai')+' · '+provider:t(kind);bubble.className='message-bubble';bubble.textContent=text;body.append(meta,bubble);message.append(avatar,body);$('chat-log').append(message);
 while($('chat-log').children.length>40)$('chat-log').firstChild.remove();$('chat-log').scrollTop=$('chat-log').scrollHeight;
}
function welcome(){append(t('welcome'));$('chat-log').lastElementChild.dataset.welcome='true';}
function controls(){
 const busy=!!request;$('chat-form').setAttribute('aria-busy',String(busy));$('chat-log').setAttribute('aria-busy',String(busy));
 $('chat-form').querySelector('[type="submit"]').disabled=busy;
 for(const id of ['care-ai-consent','care-session-select','care-session-consent'])$(id).disabled=busy||(id==='care-session-consent'&&!summary);
 $('care-stop').hidden=!busy;document.querySelectorAll('.suggestion-button').forEach(b=>b.disabled=busy);
 $('ai-service-state').textContent=available?t('available')+' · '+provider:t(available===null?'checking':'unavailable');$('ai-service-dot').dataset.available=String(available===true);
}
async function checkService(){
 checked=true;$('care-check-service').disabled=true;
 try{const response=await fetch('/api/care-chat',{signal:AbortSignal.timeout(5000),cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();available=data.available===true;provider=typeof data.provider==='string'?data.provider.slice(0,80):'';}
 catch{available=false;provider='';}finally{$('care-check-service').disabled=false;controls();}
}
function clearConversation({revoke=false}={}){
 generation++;request?.abort();request=null;history=[];$('chat-log').replaceChildren();welcome();status('cleared');
 if(revoke){summary=null;contextId='';$('care-session-select').value='';$('care-session-consent').checked=false;$('care-session-preview').replaceChildren();}
 controls();
}
function sessions(){
 const list=savedSessions(),signature=list.map(s=>s.id).join(',');if(signature===sessionSignature)return;sessionSignature=signature;
 const old=$('care-session-select').value;$('care-session-select').replaceChildren(new Option(t('none'),''),...list.map(s=>new Option(`${new Date(s.startedAt).toLocaleString(language())} · ${s.descriptor.origin==='simulated'?t('sample'):t('hardware')}${s.mode==='replay'?' · '+t('replay'):''}`,s.id)));
 if(list.some(s=>s.id===old))$('care-session-select').value=old;else if(contextId)clearConversation({revoke:true});
}
function renderSummary(){
 $('care-session-preview').replaceChildren();if(!summary)return;
 const p=document.createElement('p');p.textContent=`${t('summary')}: ${summary.origin==='simulated'?t('sample'):t('hardware')}${summary.mode==='replay'?' · '+t('replay'):''} · ${summary.durationSeconds.toFixed(2)} ${t('seconds')} · ${summary.accepted} ${t('samples')} · ${summary.missing} / ${summary.timingGaps} ${t('gaps')}`;
 $('care-session-preview').append(p);for(const c of summary.channels){const row=document.createElement('p');row.textContent=`${c.label} (${c.unit}): ${c.min.toPrecision(4)} – ${c.max.toPrecision(4)}; ${language()==='es'?'media':'mean'} ${c.mean.toPrecision(4)}`;$('care-session-preview').append(row);}
}
function review(){
 const id=$('care-session-select').value;clearConversation();contextId=id;summary=null;$('care-session-consent').checked=false;$('care-session-preview').replaceChildren();
 if(!id){controls();return;}
 try{summary=sessionSummary(savedSessions().find(s=>s.id===id));renderSummary();status('shared');}
 catch{status('invalid');}controls();
}
async function send(text){
 const message=text.trim();if(!message||message.length>2000||request)return;
 if(urgentConcern(message)){append(message,'user');append(urgentMessage(language()),'safety');$('chat-input').value='';return;}
 if(!$('care-ai-consent').checked){status('needConsent');return;}
 if(!checked||available===null)await checkService();
 if(!available){status('notSent');return;}
 if(summary&&!$('care-session-consent').checked){status('shared');return;}
 const token=++generation;request=new AbortController();controls();status('thinking');append(message,'user');$('chat-input').value='';
 const {body:requestJSON,messages}=conversationBody(history,message,language(),summary&&$('care-session-consent').checked?summary:null);
 try{
  const response=await fetch('/api/care-chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.any([request.signal,AbortSignal.timeout(25000)]),body:requestJSON});
  const body=await response.json();if(token!==generation)return;
  if(!response.ok){if(response.status===503)available=false;status(response.status===429?'rate':response.status===503?'notSent':'failed');return;}
  if(typeof body.reply!=='string'||!body.reply.trim()||body.reply.length>4000||!['ai','safety'].includes(body.kind))throw Error();
  provider=typeof body.provider==='string'?body.provider.slice(0,80):provider;append(body.reply,body.kind);if(body.kind==='ai')history=[...messages,{role:'assistant',content:body.reply}].slice(-10);status('');
 }catch(error){if(token===generation)status(error.name==='AbortError'?'stopped':'failed');}
 finally{if(token===generation){request=null;controls();}}
}
$('chat-form').addEventListener('submit',event=>{event.preventDefault();void send($('chat-input').value);});
document.querySelectorAll('.suggestion-button').forEach(button=>button.addEventListener('click',()=>void send(button.textContent)));
$('clear-chat').addEventListener('click',()=>{clearConversation({revoke:true});$('care-ai-consent').checked=false;$('chat-input').value='';$('chat-input').focus();});
$('care-stop').addEventListener('click',()=>{generation++;request?.abort();request=null;status('stopped');controls();});
$('care-check-service').addEventListener('click',()=>void checkService());
$('care-session-select').addEventListener('change',review);
$('care-remove-session').addEventListener('click',()=>clearConversation({revoke:true}));
$('care-session-consent').addEventListener('change',()=>{if(!$('care-session-consent').checked)clearConversation({revoke:true});});
$('care-ai-consent').addEventListener('change',()=>{if(!$('care-ai-consent').checked)clearConversation({revoke:true});});
$('care-offline-help').addEventListener('click',()=>append(t('guide')));
function localize(){const initial=$('chat-log').querySelector('[data-welcome]');if(initial){initial.querySelector('.message-bubble').textContent=t('welcome');initial.querySelector('.message-meta').textContent=t('local');}document.querySelectorAll('[data-care]').forEach(el=>el.textContent=t(el.dataset.care));if(statusKey)status(statusKey);sessionSignature='';sessions();renderSummary();controls();}
document.addEventListener('arteria-language',localize);
document.addEventListener('arteria-measurements',sessions);
document.addEventListener('arteria-explain-session',event=>{sessions();$('care-session-select').value=event.detail;review();$('care-context').open=true;$('care-context').scrollIntoView({block:'nearest'});});
document.addEventListener('arteria-view',event=>{if(event.detail==='care'&&!checked)void checkService();});
$('chat-log').replaceChildren();welcome();localize();
if(location.hash==='#care')void checkService();
