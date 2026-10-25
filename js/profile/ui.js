import {loadPreferences,savePreferences,initials,SETTINGS_KEY} from './preferences.js';
import {measurementInfo,historyJSON,clearRecordings} from '../measurement/ui.js';
import {t as measurementText} from '../measurement/i18n.js';
const $=id=>document.getElementById(id);
const english=Object.fromEntries([...document.querySelectorAll('[data-p]')].map(el=>[el.dataset.p,el.textContent]));
const spanish={title:'Perfil y ajustes',local:'INVITADO LOCAL',intro:'Un espacio a tu medida. Tus preferencias permanecen en este navegador; no se crea una cuenta en la nube.',personal:'Perfil personal',guest:'Perfil de invitado local · sin registro, inicio de sesión ni sincronización en la nube.',name:'Nombre visible',avatar:'Avatar',initials:'Iniciales',leaf:'Hoja',wave:'Onda',star:'Estrella',nameHelp:'Opcional. Sin nombre aparecerás como Invitado. Los avatares son símbolos locales; no se suben imágenes.',save:'Guardar perfil',appearance:'Apariencia y accesibilidad',language:'Idioma',large:'Texto más grande',contrast:'Alto contraste',motion:'Reducir movimiento',shared:'Son los mismos ajustes que se usan en los controles de la cabecera.',measurement:'Preferencias de medición',duration:'Duración predeterminada de grabación',window:'Ventana del gráfico en vivo',grid:'Mostrar cuadrícula',measurementHelp:'La duración se aplica a la próxima grabación simulada. La ventana solo cambia la vista, nunca las muestras guardadas. Se conserva el tiempo de reproducción.',privacy:'Datos y privacidad',savedSessions:'sesiones guardadas',privacyHelp:'El historial, los puntos de recuperación, el perfil, las preferencias, las notas y los informes exportados no están cifrados en este dispositivo. Solo el archivo de nota cifrada se protege con tu frase de contraseña. No hay copia en la nube.',export:'Exportar todas las sesiones guardadas (JSON)',delete:'Eliminar grabaciones',clear:'Borrar datos locales de Arteria',clearHelp:'El borrado elimina grabaciones, puntos de recuperación, preferencias y perfil. Los archivos descargados permanecen. Detén la grabación primero.',device:'Información del dispositivo',status:'Conexión',source:'Origen de la sesión',identity:'Identidad del dispositivo u origen',channels:'Canales disponibles de la sesión',battery:'Batería',hardware:'Adaptador pendiente del firmware y protocolo de Nina. La simulación y la reproducción no establecen una conexión física.',about:'Acerca de Arteria',purpose:'Aplicación de investigación para un dispositivo corporal y el Congressional App Challenge de 2026: adquirir, inspeccionar y revisar mediciones con un origen claro.',medical:'Arteria no es una herramienta de diagnóstico validada clínicamente. No diagnostica TVP ni calcula riesgo médico. Las comprobaciones describen la calidad técnica de los datos.',ai:'El desarrollo y las pruebas tuvieron asistencia de IA. Los estudiantes deben revisar el código y describir sus contribuciones reales.'};
const messages={en:{saved:'Saved on this device.',temporary:'Applied for this visit, but could not be saved on this device.',error:'Local data could not be read or changed. Changes may be incomplete. Stop active recordings in every tab and try again.',deleted:'Recordings and recovery checkpoints deleted.',cleared:'Local Arteria data cleared. Downloaded files remain.',deleteConfirm:'Delete all saved recordings and recovery checkpoints? Downloaded files remain. Export a backup first.',clearConfirm:'Clear all local Arteria recordings, recovery checkpoints, guest profile and preferences? This also clears note forms and this conversation. Downloaded files remain.',guestName:'Guest',hello:'Hello',open:'Open Profile & Settings',empty:'No session available',exported:'Saved history exported. Each recording can be opened through Photon replay. The archive itself is not a single replay recording.',localProfile:'Local guest · no account'},es:{saved:'Guardado en este dispositivo.',temporary:'Aplicado en esta visita, pero no se pudo guardar en el dispositivo.',error:'No se pudieron leer o cambiar los datos locales. Los cambios pueden estar incompletos. Detén las grabaciones en todas las pestañas e inténtalo de nuevo.',deleted:'Grabaciones y puntos de recuperación eliminados.',cleared:'Datos locales de Arteria borrados. Los archivos descargados permanecen.',deleteConfirm:'¿Eliminar todas las grabaciones y puntos de recuperación? Los archivos descargados permanecen. Exporta una copia primero.',clearConfirm:'¿Borrar grabaciones, puntos de recuperación, perfil y preferencias locales de Arteria? También se borran formularios de notas y esta conversación. Los archivos descargados permanecen.',guestName:'Invitado',hello:'Hola',open:'Abrir perfil y ajustes',empty:'Sin sesión disponible',exported:'Historial exportado. Cada grabación se puede abrir en Photon. El archivo completo no es una sola grabación.',localProfile:'Invitado local · sin cuenta'}};
const lang=()=>document.documentElement.lang==='es'?'es':'en';
const m=key=>messages[lang()][key];
let statusKey='';
function notice(key){statusKey=key;$('profile-message').textContent=m(key);}
function identity(){
 const p=loadPreferences(),name=p.displayName||m('guestName'),avatar=({leaf:'❧',wave:'≈',star:'✧'})[p.avatar]||initials(name);
 document.querySelectorAll('.profile-avatar').forEach(el=>el.textContent=avatar);
 document.querySelector('.profile-copy strong').textContent=name;
 document.querySelector('.profile-copy small').textContent=m('localProfile');
 document.querySelector('.top-profile-name').textContent=name;
 for(const id of ['top-profile','profile-button'])$(id).setAttribute('aria-label',m('open'));
 document.querySelector('[data-i18n="overview.greeting"]').textContent=`${m('hello')}, ${name}`;
}
function syncControls(){
 const p=loadPreferences();$('profile-language').value=lang();
 for(const [a,b]of [['large','large-text-toggle'],['contrast','contrast-toggle'],['motion','motion-toggle']])$('profile-'+a).checked=$(b).checked;
 $('profile-duration').value=String(p.duration);$('profile-window').value=String(p.windowSeconds);$('profile-grid').checked=p.grid;
}
function updateData(){
 const {state,session,count,ready,storageError}=measurementInfo(),busy=state.active||state.saving||clearing;
 $('profile-session-count').textContent=storageError?'—':new Intl.NumberFormat(lang()).format(count);
 for(const id of ['profile-delete','profile-clear'])$(id).disabled=!ready||busy;
 $('profile-export').disabled=!ready||busy||!!storageError||!count;
 $('profile-device-state').textContent=measurementText(state.status==='replay'?'replayState':state.status);
 $('profile-device-source').textContent=session?`${measurementText(session.descriptor.origin==='simulated'?'originSim':'originHardware')} · ${measurementText(session.mode==='replay'?'playback':'stream')}`:m('empty');
 $('profile-device-name').textContent=session?.descriptor.deviceName||measurementText('noDevice');
 $('profile-device-channels').textContent=session?.descriptor.channels.map(c=>`${c.label} (${c.unit})`).join(' · ')||'—';
 const battery=state.active&&session?.descriptor.origin==='hardware'&&session.mode==='stream'?session.samples.at(-1)?.batteryPercent:undefined;
 $('profile-device-battery').textContent=battery===undefined?measurementText('noBattery'):`${battery}%`;
}
function localize(){
 document.querySelectorAll('[data-p]').forEach(el=>el.textContent=(lang()==='es'?spanish:english)[el.dataset.p]||english[el.dataset.p]);
 if(statusKey)$('profile-message').textContent=m(statusKey);
 identity();syncControls();updateData();
}
function save(patch){try{savePreferences({...loadPreferences(),...patch});notice('saved');}catch{notice('temporary');}identity();document.dispatchEvent(new CustomEvent('arteria-preferences',{detail:{durationChanged:'duration' in patch}}));}
$('profile-name').value=loadPreferences().displayName;$('profile-avatar').value=loadPreferences().avatar;
$('profile-form').addEventListener('submit',event=>{event.preventDefault();save({displayName:$('profile-name').value,avatar:$('profile-avatar').value});$('profile-name').value=loadPreferences().displayName;});
$('profile-language').addEventListener('change',()=>{$('language-select').value=$('profile-language').value;$('language-select').dispatchEvent(new Event('change'));});
for(const [a,b]of [['large','large-text-toggle'],['contrast','contrast-toggle'],['motion','motion-toggle']])$('profile-'+a).addEventListener('change',()=>{$(b).checked=$('profile-'+a).checked;$(b).dispatchEvent(new Event('change'));});
for(const [id,key]of [['duration','duration'],['window','windowSeconds'],['grid','grid']])$('profile-'+id).addEventListener('change',()=>save({[key]:id==='grid'?$('profile-grid').checked:Number($('profile-'+id).value)}));
$('profile-export').addEventListener('click',()=>{
 try{const content=historyJSON(),url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='arteria-session-history.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('exported');}catch{notice('error');}
});
let clearing=false;
async function erase(all){
 if(clearing||!confirm(m(all?'clearConfirm':'deleteConfirm')))return;
 clearing=true;$('profile-clear').disabled=true;$('profile-delete').disabled=true;
 try{
  await clearRecordings();
  if(all){
   for(const id of ['clear-note','clear-chat'])$(id).click();
   for(const id of ['chat-input','encrypted-file','decrypt-passphrase'])if($(id))$(id).value='';
   $('decrypt-status').textContent='';
   window.speechSynthesis?.cancel();
   $('location-consent').checked=false;$('location-consent').dispatchEvent(new Event('change'));
   // Reset through existing handlers, then remove only Arteria-owned preference keys.
   $('language-select').value='en';$('language-select').dispatchEvent(new Event('change'));
   for(const id of ['large-text-toggle','contrast-toggle','motion-toggle']){$(id).checked=false;$(id).dispatchEvent(new Event('change'));}
   savePreferences({});
   for(const key of [SETTINGS_KEY,'arteria-language','arteria-accessibility'])localStorage.removeItem(key);
   $('profile-name').value='';$('profile-avatar').value='initials';document.dispatchEvent(new CustomEvent('arteria-preferences',{detail:{durationChanged:true}}));localize();
  }
  notice(all?'cleared':'deleted');
  $('profile-message').setAttribute('tabindex','-1');$('profile-message').focus({preventScroll:true});
 }catch{notice('error');}finally{clearing=false;updateData();}
}
$('profile-delete').addEventListener('click',()=>void erase(false));$('profile-clear').addEventListener('click',()=>void erase(true));
document.addEventListener('arteria-language',localize);
document.addEventListener('arteria-accessibility',syncControls);
document.addEventListener('arteria-measurements',updateData);
document.addEventListener('arteria-view',e=>{if(e.detail==='profile'){syncControls();updateData();}});
localize();
