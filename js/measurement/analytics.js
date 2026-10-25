import {processSamples} from './processing.js';
export function recordingAnalytics(sessions){
 const days=new Map();let missing=0,rejected=0,accepted=0,withGaps=0;
 const rows=sessions.map(s=>{const d=processSamples(s.samples,s.descriptor,s.rejected);const date=new Date(s.startedAt);const key=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');days.set(key,(days.get(key)||0)+1);missing+=d.missing;rejected+=d.rejected;accepted+=d.accepted;if(d.missing||d.timingGaps)withGaps++;return {id:s.id,startedAt:s.startedAt,origin:s.descriptor.origin,mode:s.mode,accepted:d.accepted,missing:d.missing,rejected:d.rejected,timingGaps:d.timingGaps};});
 return {count:sessions.length,activeDays:days.size,accepted,missing,rejected,withGaps,days:[...days].sort(([a],[b])=>a.localeCompare(b)).map(([day,count])=>({day,count})),rows};
}
