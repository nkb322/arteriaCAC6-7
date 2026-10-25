// Keep a whole number of previous user/assistant pairs within the wire budget.
export function conversationBody(history,message,language,session){
 const messages=[...history.slice(-10),{role:'user',content:message}];
 const payload=()=>({messages,language,...(session?{session,sessionConsent:true}:{})});
 while(new TextEncoder().encode(JSON.stringify(payload())).length>23500&&messages.length>1)messages.splice(0,2);
 const body=JSON.stringify(payload());if(new TextEncoder().encode(body).length>24576)throw Error('size');return {body,messages};
}
