export const SETTINGS_KEY='arteria-profile-v1';
export const DEFAULTS=Object.freeze({version:1,displayName:'',avatar:'initials',duration:20,windowSeconds:20,grid:true,onboarding:true});
export function normalizePreferences(value){
  const v=value&&typeof value==='object'?value:{};
  return {version:1,displayName:typeof v.displayName==='string'?v.displayName.trim().slice(0,60):'',avatar:['initials','leaf','wave','star'].includes(v.avatar)?v.avatar:'initials',duration:[10,20,60].includes(v.duration)?v.duration:20,windowSeconds:[5,10,20,60].includes(v.windowSeconds)?v.windowSeconds:20,grid:typeof v.grid==='boolean'?v.grid:true,onboarding:typeof v.onboarding==='boolean'?v.onboarding:true};
}
let volatilePreferences=null;
export function loadPreferences(storage){if(!storage&&volatilePreferences)return {...volatilePreferences};try{return normalizePreferences(JSON.parse((storage??localStorage).getItem(SETTINGS_KEY)||'{}'));}catch{return {...DEFAULTS};}}
export function savePreferences(value,storage){const next=normalizePreferences(value);if(!storage)volatilePreferences=next;(storage??localStorage).setItem(SETTINGS_KEY,JSON.stringify(next));return next;}
export function initials(name){return name.trim().split(/\s+/u).filter(Boolean).slice(0,2).map(s=>Array.from(s)[0]).join('').toLocaleUpperCase()||'G';}
