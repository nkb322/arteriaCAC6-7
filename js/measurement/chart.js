import {t,language} from './i18n.js';
import {loadPreferences} from '../profile/preferences.js';
import {chartGeometry} from './chart-data.js';
const inspected=new WeakMap();
const ns='http://www.w3.org/2000/svg';
function element(name,attrs){const e=document.createElementNS(ns,name);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;}
export function drawChart(container,session,channelId,{live=false}={}){
  container.replaceChildren();
  const channel=session?.descriptor.channels.find(c=>c.id===channelId)||session?.descriptor.channels[0];
  if(!session?.samples.length||!channel){const p=document.createElement('p');p.className='chart-empty';p.textContent=t('noData');container.append(p);return;}
  const preferences=loadPreferences();
  const width=Math.max(300,Math.min(760,container.clientWidth||760)),data=chartGeometry(session,channel,{live,width,windowSeconds:preferences.windowSeconds});
  const svg=element('svg',{viewBox:`0 0 ${width} 200`,role:'img','aria-label':`${channel.label} (${channel.unit}), ${data.count} ${t('samples')}. ${t('sessionAt')}: ${new Date(session.startedAt).toLocaleString(language())}. ${session.descriptor.origin==='simulated'?t('originSim'):t('originHardware')}.`});
  for(let i=0;preferences.grid&&i<4;i++)svg.append(element('line',{x1:55,x2:width-20,y1:15+i*50,y2:15+i*50,stroke:'#e6ece9','stroke-dasharray':'4 4'}));
  svg.append(element('path',{d:data.path,fill:'none',stroke:'#319b82','stroke-width':2,'vector-effect':'non-scaling-stroke'}));
  const format=new Intl.NumberFormat(language(),{maximumSignificantDigits:4});
  for(const [x,y,value]of [[3,18,format.format(data.max)],[3,166,format.format(data.min)],[55,187,data.startSeconds.toFixed(1)],[width-50,187,data.endSeconds.toFixed(1)]]){const label=element('text',{x,y,fill:'#52695d','font-size':12});label.textContent=value;svg.append(label);}
  const caption=document.createElement('p');caption.className='measurement-note';caption.textContent=`${channel.label} · ${channel.unit} · ${t('axis')}`;container.append(svg,caption);
  if(!live){
   const key=session.id+':'+channel.id,previous=inspected.get(container),index=previous?.key===key?Math.min(previous.index,session.samples.length-1):0;
   const label=document.createElement('label'),slider=document.createElement('input'),readout=document.createElement('output');label.className='chart-inspector';label.append(document.createTextNode(language()==='es'?'Inspeccionar muestra':'Inspect sample'));slider.type='range';slider.min='0';slider.max=String(session.samples.length-1);slider.step='1';slider.value=String(index);slider.setAttribute('aria-label',language()==='es'?'Inspeccionar muestra':'Inspect sample');
   const marker=element('circle',{r:4,fill:'#236c5b',stroke:'#fff','stroke-width':2});svg.append(marker);
   const inspect=()=>{const i=Number(slider.value),sample=session.samples[i],first=session.samples[0].deviceTimeMs,span=Math.max(1,session.samples.at(-1).deviceTimeMs-first);inspected.set(container,{key,index:i});marker.setAttribute('cx',55+(sample.deviceTimeMs-first)/span*(width-75));marker.setAttribute('cy',165-(sample.raw[channel.id]-data.min)/(data.max-data.min)*150);readout.textContent=`${i+1}/${session.samples.length} · ${((sample.deviceTimeMs-first)/1000).toFixed(2)} s · ${format.format(sample.raw[channel.id])} ${channel.unit}`;slider.setAttribute('aria-valuetext',readout.textContent);};slider.addEventListener('input',inspect);label.append(slider,readout);container.append(label);inspect();
  }
}
