// Pure chart geometry shared by live views and offline HTML reports.
export function chartGeometry(session,channel,{live=false,width=760}={}){
  const samples=live?session.samples.slice(-500):session.samples;
  if(!samples.length)return null;
  let min=Infinity,max=-Infinity;
  for(const sample of samples){min=Math.min(min,sample.raw[channel.id]);max=Math.max(max,sample.raw[channel.id]);}
  const padding=Math.max((max-min)*.1,Math.max(Math.abs(min),Math.abs(max))*1e-6,1e-9);min-=padding;max+=padding;
  const first=samples[0].deviceTimeMs,span=Math.max(1,samples.at(-1).deviceTimeMs-first);
  const stride=Math.max(1,Math.ceil(samples.length/600)),indices=new Set([0,samples.length-1]);
  for(let i=0;i<samples.length;i+=stride){let low=i,high=i;
    for(let j=i;j<Math.min(i+stride,samples.length);j++){
      if(samples[j].raw[channel.id]<samples[low].raw[channel.id])low=j;
      if(samples[j].raw[channel.id]>samples[high].raw[channel.id])high=j;
      if(j&&(samples[j].sequence>samples[j-1].sequence+1||samples[j].deviceTimeMs-samples[j-1].deviceTimeMs>1800/session.descriptor.sampleRateHz)){indices.add(j-1);indices.add(j);}
    }indices.add(low);indices.add(high);
  }
  let path='',firstPoint=true;
  for(const i of [...indices].sort((a,b)=>a-b)){
    const sample=samples[i],gap=firstPoint||(i>0&&(sample.sequence>samples[i-1].sequence+1||sample.deviceTimeMs-samples[i-1].deviceTimeMs>1800/session.descriptor.sampleRateHz));
    path+=`${gap?'M':'L'}${(55+(sample.deviceTimeMs-first)/span*(width-75)).toFixed(2)},${(165-(sample.raw[channel.id]-min)/(max-min)*150).toFixed(2)} `;firstPoint=false;
  }
  return {path,min,max,count:samples.length,startSeconds:(first-session.samples[0].deviceTimeMs)/1000,endSeconds:(samples.at(-1).deviceTimeMs-session.samples[0].deviceTimeMs)/1000};
}
