// @ts-nocheck
/* English label fitting for diagram boxes — verbatim port of the live page's runtime (build/mobile/i18n/runtime.js).
   Wraps box labels at spaces and shrinks them a little so longer English text stays inside its box; keeps the 🔍/⤵ spot clear;
   widens the badges. Uses the reader's real fonts (canvas measureText), so it runs in the browser after render.
   Chinese layout is never touched (callers only run it in English). */
 function cv(){return window.__fitCv||(window.__fitCv=document.createElement('canvas').getContext('2d'));}
 /* computed-style cache for one fitting pass: all reads happen in one style recalc, our own writes update the cache (no read/write thrash) */
 var CSC=null;
 function gcs(t){if(!CSC)return getComputedStyle(t);var c=CSC.get(t);if(!c){var x=getComputedStyle(t);c={fontSize:x.fontSize,fontWeight:x.fontWeight,fontFamily:x.fontFamily,textAnchor:x.textAnchor};CSC.set(t,c);}return c;}
 function csFs(e,fs,from){if(!CSC)return;var b=gcs(from||e);CSC.set(e,{fontSize:fs+'px',fontWeight:b.fontWeight,fontFamily:b.fontFamily,textAnchor:b.textAnchor});}
 function pass(L,fn){var o=CSC;CSC=new WeakMap();try{L.forEach(function(svg){svg.querySelectorAll('text').forEach(gcs);});fn();}finally{CSC=o;}}
 function fnt(t,fs){var cs=gcs(t);return (cs.fontWeight||'400')+' '+fs+'px '+cs.fontFamily;}
 function mw(s,f){var c=cv();c.font=f;return c.measureText(s).width;}
 function wrapL(s,f,avf){var ws=s.match(/\[[^\]]*\]|[^\s\[]+|\s+/g)||[],L=[],cur='';for(var i=0;i<ws.length;i++){var k=ws[i];if(!k)continue;if(!/^\s+$/.test(k)&&cur.trim()&&mw((cur+k).trim(),f)>avf(L.length)){L.push(cur.trim());cur=k;}else cur+=k;}if(cur.trim())L.push(cur.trim());return L;}
 function geo(g){var r=g.querySelector(':scope>rect.main');if(!r)return null;return {x:+r.getAttribute('x'),y:+r.getAttribute('y'),w:+r.getAttribute('width'),h:+r.getAttribute('height')};}
 function texts(g){return [].filter.call(g.querySelectorAll(':scope>text'),function(t){return t.textContent.indexOf('🔍')<0&&!t.dataset.fitc;});}
 function zoomOf(g){return [].filter.call(g.querySelectorAll(':scope>text'),function(t){return t.textContent.indexOf('🔍')>=0;})[0];}
 function zrect(z){var fs=+z.getAttribute('font-size')||parseFloat(gcs(z).fontSize)||12,x=+z.getAttribute('x'),y=+z.getAttribute('y');return [x-fs*0.7,y-fs*0.95,x+fs*0.7,y+fs*0.2];}
 function lineRects(g){var out=[];texts(g).concat([].filter.call(g.querySelectorAll(':scope>text'),function(t){return t.dataset.fitc;})).forEach(function(t){var cs=gcs(t),fs=parseFloat(cs.fontSize)||13,tl=+t.getAttribute('textLength'),wd=tl||mw(t.textContent,fnt(t,fs)),x=+t.getAttribute('x'),y=+t.getAttribute('y'),a=cs.textAnchor,l=a==='middle'?x-wd/2:a==='end'?x-wd:x;out.push([l,y-fs*0.8,l+wd,y+fs*0.22]);});return out;}
 function hit(a,b){return !(a[2]<=b[0]||a[0]>=b[2]||a[3]<=b[1]||a[1]>=b[3]);}
 function fitBox(g,force,zr){var G=geo(g);if(!G)return;var T=texts(g);if(!T.length)return;var x=G.x,y=G.y,w=G.w,h=G.h,cx=x+w/2,av=w-12;
  var items=T.map(function(t){var fs=t.dataset.fs?+t.dataset.fs:parseFloat(gcs(t).fontSize)||13;var isT=t.classList.contains('t');return {t:t,s:(t.dataset.fit||t.textContent),fs:fs,min:isT?Math.min(fs,12.6):fs,min2:isT?Math.min(fs,12.2):Math.min(fs,12.1)};});
  if(!force&&!items.some(function(it){return mw(it.s,fnt(it.t,it.fs))>av+0.5;}))return;
  var top=g.querySelector('.badge')?11:5,bot=4,room=h-top-bot,best=null;
  function tryL(sc,lhf,useMin2){var tot=0,ok=true,lay=items.map(function(it){var fs=Math.max(useMin2?it.min2:it.min,+(it.fs*sc).toFixed(2));return {it:it,fs:fs,f:fnt(it.t,fs),lh:fs*lhf};});
   lay.forEach(function(o){o.L=wrapL(o.it.s,o.f,function(){return av;});tot+=o.L.length*o.lh;});
   if(tot>room)return {lay:lay,tot:tot,ok:false};
   /* with the lines placed, re-check against the 🔍 icon band and rewrap the lines that would touch it */
   for(var pass=0;pass<2;pass++){var cy=y+top+(room-tot)/2;tot=0;lay.forEach(function(o){var c0=cy;o.L=wrapL(o.it.s,o.f,function(i){var by=c0+o.lh*(i+0.8),band=[cx-av/2,by-o.fs*0.8,cx+av/2,by+o.fs*0.22];if(zr&&hit(band,zr))return Math.max(20,2*(zr[0]-cx)-4);return av;});cy+=o.L.length*o.lh;tot+=o.L.length*o.lh;});if(tot>room){ok=false;break;}}
   lay.forEach(function(o){o.L.forEach(function(l){if(mw(l,o.f)>av+0.5)ok=false;});});
   return {lay:lay,tot:tot,ok:ok};}
  var seq=[[1,1.2,false],[1,1.1,false]];for(var sc=0.95;sc>=0.69;sc-=0.05)seq.push([sc,1.15,false]);seq.push([0.5,1.12,true]);
  for(var i=0;i<seq.length;i++){best=tryL.apply(null,seq[i]);if(best.ok)break;}
  var cy=y+top+Math.max(0,(room-best.tot)/2);
  best.lay.forEach(function(o){var t=o.it.t;if(!t.dataset.fit){t.dataset.oy=t.getAttribute('y');t.dataset.ox=t.getAttribute('x');t.dataset.ost=t.getAttribute('style')||'';}t.dataset.fit=o.it.s;var nx=t.nextSibling;while(nx&&nx.nodeType===1&&nx.dataset&&nx.dataset.fitc){var d=nx;nx=nx.nextSibling;d.remove();}
   o.L.forEach(function(l,i){var e=i?t.cloneNode(false):t;if(i){e.dataset.fitc='1';t.parentNode.insertBefore(e,nx);}e.textContent=l;e.setAttribute('x',cx);e.setAttribute('y',(cy+o.lh*0.8).toFixed(1));e.style.fontSize=o.fs+'px';csFs(e,o.fs,t);
    if(mw(l,o.f)>av+0.5){e.setAttribute('textLength',av);e.setAttribute('lengthAdjust','spacingAndGlyphs');}else{e.removeAttribute('textLength');}cy+=o.lh;});});}
 function reset(svg){svg.querySelectorAll('[data-fitc]').forEach(function(e){e.remove();});svg.querySelectorAll('text[data-fit]').forEach(function(t){t.textContent=t.dataset.fit;t.setAttribute('y',t.dataset.oy);t.setAttribute('x',t.dataset.ox);if(t.dataset.ost)t.setAttribute('style',t.dataset.ost);else t.removeAttribute('style');t.removeAttribute('textLength');t.removeAttribute('lengthAdjust');delete t.dataset.fit;});
  svg.querySelectorAll('text[data-fs2]').forEach(function(t){if(t.dataset.fs2==='-')t.removeAttribute('style');else t.setAttribute('style',t.dataset.fs2);t.removeAttribute('textLength');t.removeAttribute('lengthAdjust');delete t.dataset.fs2;});}
 /* re-fit everything once the page has its final (mobile) styles */
 /* fit one drawing (idempotent: reset first) */
 function needs(svg){return !!svg.querySelector('g.comp,text[data-fit],text[data-fs2]');}
 function refitList(L){L=L.filter(needs);if(!L.length)return;L.forEach(reset);
  pass(L,function(){L.forEach(fitNow);if(typeof fixZoom==='function')L.forEach(fixZoom);L.forEach(fitZoomNow);});}
 function refit(svg){refitList([svg]);}
 /* hidden stations are fitted when they are first shown (__refitIn from navigation), not during start-up */
 function hiddenSvg(svg){var lv=svg.closest('.level');if(lv)return !lv.classList.contains('active');var tp=svg.closest('#trainPanel');return !!(tp&&!(tp.closest('.level.active')));}
 /* while the app is being built every drawing is fitted once, afterwards, by __refitAll (visible) / __refitIn (on navigation) */
 function fitNow(svg){
  svg.querySelectorAll('.badge').forEach(function(b){var t=b.querySelector('text'),rc=b.querySelector('rect');if(!t||!rc)return;var cs=gcs(t),wd=mw(t.textContent,(cs.fontWeight||'700')+' '+(parseFloat(cs.fontSize)||12)+'px '+cs.fontFamily)+16,ow=+rc.getAttribute('width');if(wd>ow){var cx=+t.getAttribute('x');rc.setAttribute('x',(cx-wd/2).toFixed(1));rc.setAttribute('width',wd.toFixed(1));}});
  svg.querySelectorAll('g.comp').forEach(function(g){fitBox(g,false,null);});
  /* free-standing labels: keep them inside the drawing */
  var vb=svg.viewBox&&svg.viewBox.baseVal;if(!vb||!vb.width)return;
  [].forEach.call(svg.querySelectorAll('text'),function(t){if(t.closest('g.comp')||t.closest('.badge')||t.getAttribute('transform'))return;var s=t.textContent;if(!s)return;var cs=gcs(t),fs=parseFloat(cs.fontSize)||13,wd=mw(s,fnt(t,fs)),x=+t.getAttribute('x')||0,a=cs.textAnchor;
   var l=a==='middle'?x-wd/2:a==='end'?x-wd:x,rr=l+wd;if(l>=vb.x+1&&rr<=vb.x+vb.width-1)return;
   var avail=a==='middle'?2*Math.min(x-vb.x,vb.x+vb.width-x)-4:a==='end'?x-vb.x-3:vb.x+vb.width-x-3;if(avail<20)return;
   var fs2=Math.max(12.1,fs*avail/wd);if(!t.dataset.fs2)t.dataset.fs2=t.getAttribute('style')||'-';t.style.fontSize=fs2+'px';csFs(t,fs2);if(mw(s,fnt(t,fs2))>avail){t.setAttribute('textLength',avail.toFixed(1));t.setAttribute('lengthAdjust','spacingAndGlyphs');}});};
 /* after the page's own 🔍 placement: if the icon still touches a label, try the other corners, else keep it bottom-right and re-wrap around it */
 function fitZoomNow(svg){svg.querySelectorAll('g.comp').forEach(function(g){var z=zoomOf(g),G=geo(g);if(!z||!G)return;
  var R=lineRects(g);if(!R.some(function(b){return hit(zrect(z),b);}))return;
  var x=G.x,y=G.y,w=G.w,h=G.h,cand=[[x+w-14,y+h-8,13],[x+w-10,y+h-4,12],[x+w-10,y+16,12],[x+10,y+h-4,12],[x+10,y+16,12]];
  for(var i=0;i<cand.length;i++){var c=cand[i];z.setAttribute('x',c[0]);z.setAttribute('y',c[1]);z.setAttribute('font-size',c[2]);if(!R.some(function(b){return hit(zrect(z),b);}))return;}
  z.setAttribute('x',x+w-10);z.setAttribute('y',y+h-4);z.setAttribute('font-size',12);fitBox(g,true,zrect(z));});};
/** fit a list of svgs (idempotent: previous fitting is reset first) */
/* note: the live refitList checks `typeof fixZoom` — fixZoom lives inside the app closure, not in the fitter's scope,
   so on the live page that branch never runs; it is the same (undefined) here. */
export function fitSvgs(list){refitList([].slice.call(list));}
export function resetSvg(svg){reset(svg);}
