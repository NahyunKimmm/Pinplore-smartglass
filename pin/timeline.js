/* Pinplore glass · Drop a Pin — deterministic timeline.
   Indicator rule (same as the mobile prototype): a white circle shows only when an action
   happens — a short pulse on select, and a held circle while dragging. */
const $=id=>document.getElementById(id);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,k)=>a+(b-a)*k;
const prog=(t,a,b)=>clamp((t-a)/(b-a));
const eio=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const eout=k=>1-Math.pow(1-k,3);
const params=new URLSearchParams(location.search);
const CAPTURE=params.has('capture');
if(CAPTURE)document.body.classList.add('capture');

/* ---------- timing (s) ---------- */
const T={
  catIn:[0.4,0.9],
  press:1.7,              // select SCENERY (pinch) → pin appears
  drag:[2.1,3.5],         // drag pin to the spot
  release:3.75,
  catOut:[4.25,4.65], noteIn:[4.55,5.0],
  dictTap:6.0,            // tap Dictate
  dict:[6.2,10.8],        // dictation running
  dropTap:11.7,           // tap Drop Pin
  noteOut:[12.05,12.45],
  end:13.6
};
const DUR=T.end;
const PIN={x:982,y:150,s:96.551};          // Figma pin position
const PIN_C={x:PIN.x+PIN.s/2,y:PIN.y+PIN.s/2};
const OFF={x:40,y:36};             // pinch point relative to pin centre

/* ---------- dictation ---------- */
const TEXT="Did anyone know that... the very first beam of this tower went up right here, long before the city grew around it.";
const WORDS=TEXT.split(' ');
const wordTimes=(()=>{let t=T.dict[0]+.2,out=[];WORDS.forEach((w,i)=>{out.push(t);
  let d=.13+w.length*.028+(((i*37)%7)/7)*.09; if(/[.,]$/.test(w))d+=.3; if(w==='that...')d+=.35; t+=d;});
  const a=out[0],z=T.dict[1]-.45,sc=(z-a)/(out[out.length-1]-a);return out.map(v=>a+(v-a)*Math.min(1,sc))})();
function buildTyped(){const p=$('typed');p.innerHTML='';
  WORDS.forEach((w,i)=>{const s=document.createElement('span');s.className='w';s.textContent=w;p.appendChild(s);
    if(i<WORDS.length-1)p.appendChild(document.createTextNode(' '))});
  const c=document.createElement('span');c.className='caret';c.id='caret';c.textContent='|';p.appendChild(c);}

/* ---------- geometry ---------- */
const G={};
function rect(el){const s=$('stage').getBoundingClientRect(),r=el.getBoundingClientRect(),k=s.width/1536;
  return{x:(r.left-s.left)/k,y:(r.top-s.top)/k,w:r.width/k,h:r.height/k,cx:(r.left-s.left+r.width/2)/k,cy:(r.top-s.top+r.height/2)/k}}

/* measure the badges/buttons from layout; re-run on every restart because a preloaded,
   hidden frame can report zero sizes (Safari) */
function measure(){const st=$('stage').style.transform,ct=$('cat').style.transform;
  $('stage').style.transform='none';$('cat').style.transform='none';
  const g={sc:rect($('b-scenery')),dict:rect($('dict')),drop:rect($('drop'))};
  if(g.sc.w>0&&isFinite(g.sc.cx))Object.assign(G,g);
  $('stage').style.transform=st;$('cat').style.transform=ct;}
/* fallback geometry (Figma layout) in case measuring is impossible */
Object.assign(G,{sc:{cx:224.5,cy:336.7},dict:{cx:814.9,cy:525.6},drop:{cx:612.7,cy:629.7}});

/* tap pulse: white circle grows a little and fades (0.45s) */
function tapAt(t){
  const taps=[[T.dictTap,G.dict],[T.dropTap,G.drop]];
  for(const [t0,p] of taps){const k=prog(t,t0,t0+.45);if(t>=t0&&k<1)return{x:p.cx,y:p.cy,o:1-k,s:.5+.7*k}}
  return null;
}

let built=false;
function apply(t){
  if(!built)return;
  vsync($('bgv'),t);
  const st=(el,css)=>Object.assign(el.style,css);

  /* category card */
  const cIn=eout(prog(t,...T.catIn)),cOut=prog(t,...T.catOut);
  /* iPad camera: pans right while the pin is dragged, settles when the note opens (Figma iPad frames) */
  const cam=lerp(0,-141,eio(prog(t,...T.drag)))+lerp(0,45,eio(prog(t,...T.noteIn)));
  $('stage').style.transform=`translateX(${cam}px)`;
  st($('cat'),{opacity:cIn*(1-cOut),transform:`translate(${-cam}px,${(1-cIn)*10}px)`});
  const sel=t>=T.press?1:0;
  $('b-scenery').querySelector('.sel').style.opacity=sel;
  $('b-scenery').querySelector('.lbl').style.color=sel?'#fff':'rgba(255,255,255,.7)';

  /* pin: appears under the pinch on SCENERY, follows the drag, stays at the Figma position */
  const start={x:G.sc.cx+30,y:G.sc.cy};
  let c=null,ps=1;
  if(t>=T.press){
    const k=eio(prog(t,...T.drag));
    // c = pinch point (indicator); the pin hangs just up-left of it so the circle stays visible
    const end={x:PIN_C.x+OFF.x,y:PIN_C.y+OFF.y};
    c={x:lerp(start.x,end.x,k),y:lerp(start.y,end.y,k)-Math.sin(k*Math.PI)*60};
    const pe=eout(prog(t,T.press,T.press+.3));
    ps=lerp(.55,1,pe);
    const pc={x:c.x-OFF.x*pe,y:c.y-OFF.y*pe};
    st($('pin'),{opacity:clamp(prog(t,T.press,T.press+.15)),transform:`translate(${pc.x-PIN.s/2}px,${pc.y-PIN.s/2}px) scale(${ps})`});
  }else $('pin').style.opacity=0;

  /* held circle while pinching/dragging */
  const held=t>=T.press&&t<T.release+.25;
  const ho=held?clamp(prog(t,T.press,T.press+.12))*(1-prog(t,T.release,T.release+.25)):0;
  if(c)st($('drag'),{opacity:ho,transform:`translate(${c.x}px,${c.y}px) scale(${1-.15*prog(t,T.release,T.release+.25)})`});
  else $('drag').style.opacity=0;

  /* tap pulse */
  const tp=tapAt(t);
  if(tp)st($('tap'),{opacity:tp.o,transform:`translate(${tp.x}px,${tp.y}px) scale(${tp.s})`});
  else $('tap').style.opacity=0;

  /* note card */
  const nIn=eout(prog(t,...T.noteIn)),nOut=prog(t,...T.noteOut);
  st($('note'),{opacity:nIn*(1-nOut),transform:`translateY(${(1-nIn)*10}px)`});

  /* dictation */
  const dictOn=t>=T.dictTap+.1&&t<T.dict[1];
  $('dict').style.background=dictOn?'rgba(255,255,255,.7)':'rgba(255,255,255,.3)';
  $('dictLbl').textContent=dictOn?'Dictating...':'Dictate';
  $('dictLbl').style.color=dictOn?'#1c1c1c':'#fff';
  $('micIdle').style.opacity=dictOn?0:1;
  $('micSpin').style.opacity=dictOn?1:0;
  $('micSpin').style.transform=`rotate(${t*300}deg)`;
  const typed=t>=wordTimes[0];
  $('ph').style.opacity=(typed||dictOn)?0:1;
  const ws=$('typed').querySelectorAll('.w');let last=-1;
  ws.forEach((s,i)=>{const k=prog(t,wordTimes[i],wordTimes[i]+.16);s.style.opacity=k;if(k>0)last=i;});
  const caret=$('caret');
  caret.style.opacity=(dictOn||(typed&&t<T.dropTap))?(Math.floor(t*2)%2===0?1:0):0;
  if(last>=0){const p=$('typed').getBoundingClientRect(),r=ws[last].getClientRects(),rr=r[r.length-1],k=p.width/$('typed').offsetWidth;
    caret.style.transform=`translate(${(rr.right-p.left)/k+5}px,${(rr.top-p.top)/k}px)`;}
  else caret.style.transform='translate(0,0)';
}

/* ---------- boot / playback ---------- */
function fit(){if(CAPTURE)return;const s=Math.min(innerWidth/1210,innerHeight/834);$('vp').style.transform=`scale(${s})`}
addEventListener('resize',fit);
async function boot(){
  buildTyped();
  await document.fonts.ready;
  await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
  measure();
  fit();built=true;apply(0);window.__ready=true;
  if(!CAPTURE&&!/[?&]embed/.test(location.search))setTimeout(play,500);
}
window.__seek=t=>apply(t);window.__DUR=DUR;
let playing=false,t0=0,tNow=0;
/* footage preview: video streamed from Higgsfield, slaved to the flow clock (image stays underneath as fallback) */
function vsync(v,want){ if(!v||!v.duration)return; const end=v.duration-.05; want=Math.max(0,Math.min(end,want));
  /* the video plays on its own clock; only small rate nudges keep it with the flow, hard seeks only on big drift */
  if(playing&&want>0&&want<end){
    if(v.paused){ if(!v.seeking&&Math.abs(v.currentTime-want)>.08) v.currentTime=want; v.play().catch(()=>{}); }
    else { const d=want-v.currentTime; if(Math.abs(d)>.7&&!v.seeking){v.currentTime=want;v.playbackRate=1} else v.playbackRate=Math.max(.92,Math.min(1.08,1+d*.4)); } }
  else { if(!v.paused)v.pause(); v.playbackRate=1; if(!v.seeking&&Math.abs(v.currentTime-want)>.04) v.currentTime=want; } }

let raf=0;
function play(){cancelAnimationFrame(raf);playing=true;t0=performance.now()-tNow*1000;raf=requestAnimationFrame(loop)}
function loop(now){if(!playing)return;tNow=Math.max(0,(now-t0)/1000);if(tNow>=DUR){tNow=DUR;apply(DUR);playing=false;return}apply(tNow);raf=requestAnimationFrame(loop)}
/* shell control: the showcase drives playback in persistent frames */
window.__restart=()=>{playing=false;cancelAnimationFrame(raf);measure();tNow=0;apply(0);play()};
window.__pause=()=>{playing=false;cancelAnimationFrame(raf);try{$('bgv').pause()}catch(e){}};
window.__resume=()=>{if(!playing&&tNow<DUR)play()};
window.__t=()=>tNow;
/* fallback channel when the shell can't reach this frame directly (opened from file://) */
if(/[?&]embed/.test(location.search)){
  const st=document.createElement('style');st.textContent='#head,#headS,#headA,#headAimg{visibility:hidden!important}';document.head.appendChild(st);
  addEventListener('message',e=>{const c=e.data&&e.data.pp;if(c&&typeof window['__'+c]==='function')window['__'+c]()});
  setInterval(()=>{try{const h=document.getElementById('head')||document.getElementById('headA');
    parent.postMessage({ppT:tNow,ppDur:DUR,ppReady:!!window.__ready,ppHead:h&&h.style.opacity!==''?+h.style.opacity:1},'*')}catch(e){}},50);
}
addEventListener('keydown',e=>{
  if(e.code==='Space'){e.preventDefault();if(playing)playing=false;else{if(tNow>=DUR)tNow=0;play()}}
  if(e.key==='r'||e.key==='R'){tNow=0;apply(0);playing=false;setTimeout(play,400)}
});
boot();
