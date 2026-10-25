export function filterSessions(sessions,{days='7',from='',to='',source='all',now=Date.now()}={}){
 const start=from?new Date(from+'T00:00:00').getTime():-Infinity,end=to?new Date(to+'T23:59:59.999').getTime():Infinity;
 if((from&&!Number.isFinite(start))||(to&&!Number.isFinite(end))||start>end)throw Error('dateRange');
 const cutoff=days==='all'?-Infinity:now-Number(days)*86400000;
 return sessions.filter(s=>{const date=Date.parse(s.startedAt);return date>=cutoff&&date>=start&&date<=end&&(source==='all'||(source==='replay'?s.mode==='replay':s.descriptor.origin===source));});
}
