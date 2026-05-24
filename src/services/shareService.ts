import { v4 as uuid } from 'uuid';
export function createShareToken(){return uuid().replace(/-/g,'');}
export function shareUrl(token:string){return `${window.location.origin}/shared/${token}`;}
