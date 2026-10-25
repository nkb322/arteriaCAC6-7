import {importSession, exportJSON} from './export.js';
const DB_NAME = 'arteria-measurements-v1';
const removeChunks = (tx,id) => {
  const request=tx.objectStore('chunks').index('sessionId').openKeyCursor(IDBKeyRange.only(id));
  request.onsuccess=()=>{const cursor=request.result;if(cursor){tx.objectStore('chunks').delete(cursor.primaryKey);cursor.continue();}};
};
export class SessionStore {
  constructor(factory = globalThis.indexedDB, locks = globalThis.navigator?.locks) { this.factory=factory;this.locks=locks;this.opening=null; }
  open() {
    if(!this.factory)return Promise.reject(new Error('storage'));
    if(!this.opening)this.opening=new Promise((resolve,reject)=>{
      const request=this.factory.open(DB_NAME,2);let blocked=false;
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains('sessions'))db.createObjectStore('sessions',{keyPath:'id'});
        db.createObjectStore('drafts',{keyPath:'id'});
        db.createObjectStore('chunks',{keyPath:['sessionId','offset']}).createIndex('sessionId','sessionId');
      };
      request.onsuccess=()=>{const db=request.result;if(blocked){db.close();return;}db.onversionchange=()=>{db.close();this.opening=null;};resolve(db);};
      request.onerror=()=>reject(new Error('storage'));
      request.onblocked=()=>{blocked=true;reject(new Error('storageBlocked'));};
    }).catch(error=>{this.opening=null;throw error;});return this.opening;
  }
  async transaction(stores, mode, operation) {
    const db=await this.open();
    return new Promise((resolve,reject)=>{
      let tx,request;
      try{tx=db.transaction(stores,mode);request=operation(tx);}catch{try{tx?.abort();}catch{}reject(new Error('storage'));return;}
      tx.oncomplete=()=>resolve(request?.result);tx.onerror=tx.onabort=()=>reject(new Error('storage'));
    });
  }
  async lockSession(id) {
    if(!this.locks)return ()=>{};
    return new Promise((resolve,reject)=>{this.locks.request('arteria-session-'+id,()=>new Promise(release=>resolve(release))).catch(reject);});
  }
  checkpoint(metadata,samples,offset) {
    return this.transaction(['drafts','chunks'],'readwrite',tx=>{
      tx.objectStore('chunks').put({sessionId:metadata.id,offset,samples});
      return tx.objectStore('drafts').put({...metadata,sampleCount:offset+samples.length,checkpointAt:new Date().toISOString()});
    });
  }
  save(session) {
    return this.transaction(['sessions','drafts','chunks'],'readwrite',tx=>{
      tx.objectStore('drafts').delete(session.id);removeChunks(tx,session.id);return tx.objectStore('sessions').put(session);
    });
  }
  updateNotes(id,notes){
    if(typeof notes!=='string'||notes.length>2000)return Promise.reject(new Error('notes'));
    return this.transaction(['sessions'],'readwrite',tx=>{const request=tx.objectStore('sessions').get(id);request.onsuccess=()=>{if(!request.result){tx.abort();return;}request.result.notes=notes;tx.objectStore('sessions').put(request.result);};return request;});
  }
  updateAnalysisReport(id,report){
    if(!report||report.version!=='ai-analysis-v1'||typeof report.text!=='string'||!report.text.trim()||report.text.length>4000||typeof report.generatedAt!=='string'||!Number.isFinite(Date.parse(report.generatedAt))||(report.model!==null&&report.model!==undefined&&(typeof report.model!=='string'||report.model.length>100))||!Array.isArray(report.comparisonSessions||[])||(report.comparisonSessions||[]).length>2)return Promise.reject(new Error('analysis'));
    return this.transaction(['sessions'],'readwrite',tx=>{const request=tx.objectStore('sessions').get(id);request.onsuccess=()=>{if(!request.result){tx.abort();return;}request.result.analysisReport=report;tx.objectStore('sessions').put(request.result);};return request;});
  }
  deleteAnalysisReport(id){
    return this.transaction(['sessions'],'readwrite',tx=>{const request=tx.objectStore('sessions').get(id);request.onsuccess=()=>{if(!request.result){tx.abort();return;}delete request.result.analysisReport;tx.objectStore('sessions').put(request.result);};return request;});
  }
  async list(){return(await this.transaction(['sessions'],'readonly',tx=>tx.objectStore('sessions').getAll())).sort((a,b)=>b.startedAt.localeCompare(a.startedAt));}
  get(id){return this.transaction(['sessions'],'readonly',tx=>tx.objectStore('sessions').get(id));}
  delete(id){return this.transaction(['sessions','drafts','chunks'],'readwrite',tx=>{tx.objectStore('drafts').delete(id);removeChunks(tx,id);return tx.objectStore('sessions').delete(id);});}
  async clear(){if(this.locks && (await this.locks.query()).held.some(lock=>lock.name.startsWith('arteria-session-')))throw new Error('busy');return this.transaction(['sessions','drafts','chunks'],'readwrite',tx=>{for(const name of ['sessions','drafts','chunks'])tx.objectStore(name).clear();});}
  async recover({exclusive=false}={}) {
    this.recoveryErrors=0;
    const drafts=await this.transaction(['drafts'],'readonly',tx=>tx.objectStore('drafts').getAll());let recovered=0;
    for(const draft of drafts){
      const claim=async()=>{
        const chunks=await this.transaction(['chunks'],'readonly',tx=>tx.objectStore('chunks').index('sessionId').getAll(draft.id));
        const ordered=chunks.sort((a,b)=>a.offset-b.offset);let expected=0;
        for(const chunk of ordered){if(chunk.offset!==expected)throw new Error('storage');expected+=chunk.samples.length;}
        const samples=ordered.flatMap(c=>c.samples);
        if(samples.length!==draft.sampleCount)throw new Error('storage');
        if(!samples.length)return;
        // Treat recovered storage as untrusted and revalidate before displaying it.
        const validated=importSession(exportJSON({...draft,samples}));
        await this.save({...draft,descriptor:validated.descriptor,samples:validated.samples,derived:validated.derived,
          notes:validated.notes,status:'interrupted',recovered:true,recoveredAt:new Date().toISOString(),endedAt:samples.at(-1).receivedAt});recovered++;
      };
      try {
      if(this.locks)await this.locks.request('arteria-session-'+draft.id,{ifAvailable:true},async lock=>{if(lock)await claim();});
      else if(exclusive)await claim();
      }catch{this.recoveryErrors++;}
    }
    return recovered;
  }
}
