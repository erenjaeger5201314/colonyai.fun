// Marketplace/detail previews render user HTML inside a `sandbox="allow-scripts"`
// iframe (deliberately WITHOUT `allow-same-origin`, so the content stays in an
// opaque origin and can't reach the parent page). In an opaque origin, accessing
// localStorage/sessionStorage throws a SecurityError — so any app that reads
// storage during startup (very common) crashes and renders blank.
//
// For PREVIEW responses only, we inject a tiny in-memory storage shim that kicks
// in only when the real storage throws. This lets those apps render in the
// preview without weakening the sandbox; the full-page /s/[code] view is never
// shimmed, so real localStorage there keeps persisting normally.
const PREVIEW_STORAGE_SHIM =
  '<script>(function(){try{window.localStorage.getItem("__probe__");}catch(e){' +
  'var make=function(){var s={};return{' +
  'getItem:function(k){return Object.prototype.hasOwnProperty.call(s,k)?s[k]:null;},' +
  'setItem:function(k,v){s[k]=String(v);},' +
  'removeItem:function(k){delete s[k];},' +
  'clear:function(){s={};},' +
  'key:function(i){return Object.keys(s)[i]||null;},' +
  'get length(){return Object.keys(s).length;}};};' +
  'try{Object.defineProperty(window,"localStorage",{value:make(),configurable:true});}catch(e2){}' +
  'try{Object.defineProperty(window,"sessionStorage",{value:make(),configurable:true});}catch(e2){}' +
  '}})();</script>';

/**
 * Insert the preview storage shim as early as possible (right after <head>, else
 * after <html>, else at the very start) so it runs before the page's own scripts.
 */
export function injectPreviewShim(html: string): string {
  const head = html.match(/<head[^>]*>/i);
  if (head?.index != null) {
    const at = head.index + head[0].length;
    return html.slice(0, at) + PREVIEW_STORAGE_SHIM + html.slice(at);
  }

  const htmlTag = html.match(/<html[^>]*>/i);
  if (htmlTag?.index != null) {
    const at = htmlTag.index + htmlTag[0].length;
    return html.slice(0, at) + PREVIEW_STORAGE_SHIM + html.slice(at);
  }

  return PREVIEW_STORAGE_SHIM + html;
}
