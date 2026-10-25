import {measurementInfo} from './measurement/ui.js';
const $=id=>document.getElementById(id),es=()=>document.documentElement.lang==='es';
let installPrompt=null,waiting=null,acceptedUpdate=false,dismissed=false;
const copy={en:{offline:'Offline — saved recordings and cached app tools remain available. AI and clinic search need a connection.',install:'Install Arteria for quick access. Local data stays in this browser.',update:'An app update is ready. Stop any recording and save your work before updating.',busy:'Stop the active recording and save it before updating.',unavailable:'Use your browser menu to install or add Arteria to the home screen, if supported.'},es:{offline:'Sin conexión: las grabaciones guardadas y herramientas en caché siguen disponibles. La IA y la búsqueda de clínicas necesitan conexión.',install:'Instala Arteria para acceder rápidamente. Los datos locales permanecen en este navegador.',update:'Hay una actualización. Detén la grabación y guarda los cambios antes de actualizar.',busy:'Detén y guarda la grabación activa antes de actualizar.',unavailable:'Usa el menú del navegador para instalar o añadir Arteria a la pantalla de inicio, si se admite.'}};
function render(){const key=!navigator.onLine?'offline':waiting?'update':installPrompt?'install':null;$('pwa-panel').hidden=!key||dismissed;$('pwa-status').textContent=key?copy[es()?'es':'en'][key]:'';$('pwa-install').hidden=!installPrompt;$('pwa-update').hidden=!waiting;}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;dismissed=false;render();});
window.addEventListener('appinstalled',()=>{installPrompt=null;render();});
for(const name of ['online','offline'])window.addEventListener(name,()=>{dismissed=false;render();});
document.addEventListener('arteria-language',render);
$('pwa-dismiss').addEventListener('click',()=>{dismissed=true;render();});
$('pwa-install').addEventListener('click',async()=>{if(!installPrompt)return;const prompt=installPrompt;installPrompt=null;try{await prompt.prompt();await prompt.userChoice;}catch{}render();});
$('pwa-update').addEventListener('click',()=>{const {state}=measurementInfo();if(state.active||state.saving||state.unsaved){$('pwa-status').textContent=copy[es()?'es':'en'].busy;return;}if(waiting&&confirm(copy[es()?'es':'en'].update)){acceptedUpdate=true;waiting.postMessage({type:'ACTIVATE_UPDATE'});}});
if('serviceWorker' in navigator&&window.isSecureContext){
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(acceptedUpdate)location.reload();});
 navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(reg=>{
  const ready=()=>{if(reg.waiting&&navigator.serviceWorker.controller){waiting=reg.waiting;dismissed=false;render();}};ready();reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',ready);});
 }).catch(()=>{/* Source-only servers have no generated worker. Normal features remain available. */});
}
render();
