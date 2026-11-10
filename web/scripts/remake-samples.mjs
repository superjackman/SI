/* Stations 4 and 5 only. Each narration sentence drives its own motion.
   Frames are drawn at 30fps. A pixel check rejects a still picture. */
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const repo = join(dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = join(repo, 'videos/zh');
mkdirSync(outDir, { recursive: true });

const INK = '#1c1915', NAVY = '#15202b', CARD = '#fffcf7', LINK = '#1a4a6b';
const GOOD = '#135636', HL = '#7a3f06', LV4 = '#1e40af', LINE = '#d9d3c7', MARK = '#5c3b12';
const COLS = [LINK, GOOD, HL, LV4];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);

/* Four different pieces, the same idea as the lesson: flat, a lift, a slope, a drop. */
const piece = [
  (x) => 0.12,
  (x) => Math.max(0, x - 0.25) * 1.15,
  (x) => 0.08 + x * 0.55,
  (x) => Math.max(0, 0.85 - x) * 1.05,
];
const sumAt = (x, n, steep = 1) => {
  let s = 0;
  for (let i = 0; i < n; i++) s += piece[i](x) * (i === 1 || i === 3 ? steep : 1);
  return s;
};

const BOARDS = {
  '2': [
    { say: '先看这三颗点。它们正好排在一条斜线上。', scene: 'drop' },
    { say: '两颗旋钮还停在零。线是平的，离这些点很远。', scene: 'flat' },
    { say: '顺着坡去拧左边那颗。线跟着变陡，点就离线近了一些。', scene: 'steep' },
    { say: '再拧右边那颗。它管整条线从哪里起步，线就上下挪。', scene: 'shift' },
    { say: '两颗一起拧，线坐到点上。罚分从高处掉下来。', scene: 'fit' },
    { say: '再看左边这颗旋钮。针从一侧转到另一侧，线就从平的变成斜的。', scene: 'replayW' },
    { say: '右边这颗旋钮管起步的高度。它转的时候，整条线跟着上下挪，陡的程度先别动。', scene: 'replayB' },
    { say: '同一件事可以看成一只圆碗。球现在还在碗边上。', scene: 'bowl' },
    { say: '每迈一小步，球就沿着碗壁滚下去，身后留下一串点。', scene: 'roll' },
    { say: '步子要是太大，球会冲过最低的那一圈，再荡回来。', scene: 'over' },
    { say: '把步子收小，球就停进那一圈。旋钮这时停在罚分最小的地方。', scene: 'rest' },
    { say: '绿圈标出碗底。球停在圈里，身后的点就是它滚过的路。', scene: 'rest2' },
  ],
  '3': [
    { say: '左边送进一个数。这些点先往上升，再往下降。', scene: 'rise' },
    { say: '只用一条直线去贴，线只会一直升，盖不住中间的尖。', scene: 'miss' },
    { say: '中间先放上第一颗神经元。它的小弯几乎是平的，画在右边第一个方框里。', scene: 'n1' },
    { say: '第二颗连上来。它的弯在中间抬一下头，方框下面是一个加号。', scene: 'n2' },
    { say: '第三颗是一截往上的斜坡。第四颗在后半段拐下来。', scene: 'n4' },
    { say: '四个方框用加号叠在一起。最下面加起来的那条线，才贴住这些点。', scene: 'add' },
    { say: '点是一颗一颗落上去的。总曲线画到哪里，点就坐到哪里。', scene: 'sit' },
    { say: '线上的旋钮一转，弯就变陡。圆圈里的旋钮一转，弯从别的地方开始。', scene: 'turn' },
    { say: '对角上还有两种颜色的点。只留一条弯，总有一个点站错队。', scene: 'color' },
    { say: '四条弯都留下，两种颜色才分开。没有这些弯，叠再多层也还是一条直线。', scene: 'back' },
    { say: '数沿着线从左流到右。四条弯不一样，再叠成一条。', scene: 'flow2' },
  ],
};

const html = `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;background:${CARD}}
svg{display:block;width:1280px;height:720px}
</style><svg id="s" viewBox="0 0 1280 720" width="1280" height="720"></svg><script>
const INK=${JSON.stringify(INK)}, NAVY=${JSON.stringify(NAVY)}, CARD=${JSON.stringify(CARD)}, LINK=${JSON.stringify(LINK)};
const GOOD=${JSON.stringify(GOOD)}, HL=${JSON.stringify(HL)}, LV4=${JSON.stringify(LV4)}, LINE=${JSON.stringify(LINE)}, MARK=${JSON.stringify(MARK)};
const COLS=${JSON.stringify(COLS)};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*clamp(t,0,1);
const piece=[
  (x)=>0.12,
  (x)=>Math.max(0,x-0.25)*1.15,
  (x)=>0.08+x*0.55,
  (x)=>Math.max(0,0.85-x)*1.05,
];
function sumAt(x,n,steep){let s=0;for(let i=0;i<n;i++)s+=piece[i](x)*(i===1||i===3?steep:1);return s}
function pathOf(fn, x0,y0,w,h,lo,hi,until){
  let d='';
  const n=24;
  for(let k=0;k<=n*until;k++){
    const x=k/n;
    const y=fn(x);
    const px=x0+8+x*(w-16);
    const py=y0+h-8-((y-lo)/Math.max(0.2,hi-lo))*(h-16);
    d+=(k?'L':'M')+px.toFixed(1)+' '+py.toFixed(1);
  }
  return d;
}
function dial(cx,cy,r,value,min,max,name,on){
  const t=clamp((value-min)/(max-min),0,1);
  const ang=(-140+t*280)*Math.PI/180;
  const x2=cx+Math.sin(ang)*(r-8), y2=cy-Math.cos(ang)*(r-8);
  const op=on?1:0.25;
  return '<g opacity="'+op+'"><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+CARD+'" stroke="'+NAVY+'" stroke-width="6"/>'
    +'<line x1="'+cx+'" y1="'+cy+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" stroke="'+NAVY+'" stroke-width="6" stroke-linecap="round"/>'
    +'<text x="'+cx+'" y="'+(cy+r+36)+'" text-anchor="middle" fill="'+INK+'" font-size="28" font-family="sans-serif">'+name+' '+value.toFixed(2)+'</text></g>';
}
function axes(x,y,w,h){
  return '<line x1="'+x+'" y1="'+(y+h)+'" x2="'+(x+w)+'" y2="'+(y+h)+'" stroke="'+LINE+'" stroke-width="3"/>'
    +'<line x1="'+x+'" y1="'+y+'" x2="'+x+'" y2="'+(y+h)+'" stroke="'+LINE+'" stroke-width="3"/>';
}
function chart(w,b,nPoints,showLine){
  const X=x=>160+x*150, Y=y=>520-y*52;
  let s=axes(140,160,560,380);
  s+='<text x="700" y="560" fill="'+INK+'" font-size="24" font-family="sans-serif">输入</text>';
  s+='<text x="100" y="150" fill="'+INK+'" font-size="24" font-family="sans-serif">结果</text>';
  const pts=[[1,3],[2,5],[3,7]];
  for(let i=0;i<nPoints;i++){
    const drop=i===nPoints-1?0.15:0;
    s+='<circle cx="'+X(pts[i][0])+'" cy="'+(Y(pts[i][1])+drop*0)+'" r="12" fill="'+HL+'"/>';
  }
  if(showLine){
    const x2=lerp(0.4, 3.6, showLine);
    s+='<line x1="'+X(0.4)+'" y1="'+Y(w*0.4+b)+'" x2="'+X(x2)+'" y2="'+Y(w*x2+b)+'" stroke="'+NAVY+'" stroke-width="6" stroke-linecap="round"/>';
  }
  if(nPoints){
    const i=nPoints-1;
    const ring=14+4*Math.sin((showLine===true?1:showLine)*12);
    s+='<circle cx="'+X(pts[i][0])+'" cy="'+Y(pts[i][1])+'" r="'+ring.toFixed(1)+'" fill="none" stroke="'+HL+'" stroke-width="3"/>';
  }
  return s;
}
function lossOf(w,b){
  const pts=[[1,3],[2,5],[3,7]];
  return pts.reduce((s,[x,y])=>s+(w*x+b-y)**2,0)/3;
}
function bowl(bx, trail, ring, draw){
  const at=(x)=>{ const y=180 + (1 - (x/240)**2) * 280; return [640+x, y]; };
  let d='';
  const n=Math.max(2, Math.round(40*(draw==null?1:draw)));
  for(let i=0;i<=n;i++){
    const x=-240 + (i/40)*480;
    const [px,py]=at(x);
    d+=(i?'L':'M')+ px.toFixed(1)+' '+py.toFixed(1);
  }
  let s='<path d="'+d+'" fill="none" stroke="'+LINK+'" stroke-width="8" stroke-linecap="round"/>';
  s+='<text x="70" y="200" fill="'+INK+'" font-size="28" font-family="sans-serif" transform="rotate(-90 70 360)">罚分</text>';
  s+='<text x="360" y="200" fill="'+INK+'" font-size="26" font-family="sans-serif">碗边</text>';
  s+='<text x="860" y="200" fill="'+INK+'" font-size="26" font-family="sans-serif">碗边</text>';
  if(ring){
    const [rx,ry]=at(0);
    s+='<ellipse cx="'+rx+'" cy="'+(ry-6)+'" rx="54" ry="16" fill="none" stroke="'+GOOD+'" stroke-width="6"/>';
  }
  for(const x of trail){
    const [px,py]=at(x);
    s+='<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="7" fill="'+HL+'"/>';
  }
  const [px,py]=at(bx);
  s+='<circle cx="'+px.toFixed(1)+'" cy="'+(py-16).toFixed(1)+'" r="18" fill="'+HL+'"/>';
  return s;
}
function net(neurons, flow, bends, sumP, steep, shift, colors, modelPlot, missLine){
  const hy=[150,270,390,510];
  const ix=120, iy=330, hx=340, ox=560;
  let s='<text x="'+ix+'" y="70" text-anchor="middle" fill="'+INK+'" font-size="26" font-family="sans-serif">输入</text>';
  s+='<text x="'+hx+'" y="70" text-anchor="middle" fill="'+INK+'" font-size="26" font-family="sans-serif">神经元（4 颗）</text>';
  s+='<text x="'+ox+'" y="70" text-anchor="middle" fill="'+INK+'" font-size="26" font-family="sans-serif">结果</text>';
  s+='<circle cx="'+ix+'" cy="'+iy+'" r="26" fill="none" stroke="'+INK+'" stroke-width="4"/>';
  for(let i=0;i<neurons;i++){
    const y=hy[i];
    const col=COLS[i];
    s+='<line x1="'+ix+'" y1="'+iy+'" x2="'+hx+'" y2="'+y+'" stroke="'+col+'" stroke-width="5"/>';
    s+='<line x1="'+hx+'" y1="'+y+'" x2="'+ox+'" y2="'+iy+'" stroke="'+col+'" stroke-width="5"/>';
    const fx=lerp(ix,hx,flow), fy=lerp(iy,y,flow);
    s+='<circle cx="'+fx.toFixed(1)+'" cy="'+fy.toFixed(1)+'" r="8" fill="'+col+'"/>';
    s+='<circle cx="'+hx+'" cy="'+y+'" r="28" fill="'+CARD+'" stroke="'+col+'" stroke-width="4"/>';
    const ang=(-40+steep*80+i*15)*Math.PI/180;
    s+='<line x1="'+hx+'" y1="'+y+'" x2="'+(hx+Math.sin(ang)*16).toFixed(1)+'" y2="'+(y-Math.cos(ang)*16).toFixed(1)+'" stroke="'+NAVY+'" stroke-width="4"/>';
  }
  if(neurons) s+='<circle cx="'+ox+'" cy="'+iy+'" r="28" fill="none" stroke="'+INK+'" stroke-width="4"/>';
  const boxX=760, boxW=200, boxH=78;
  for(let i=0;i<bends;i++){
    const y=120+i*100;
    const fn=(x)=>piece[i](clamp(x+shift*0.2,0,1))*(i===1||i===3?steep:1);
    const d=pathOf(fn, boxX, y, boxW, boxH, -0.05, 1.3, 1);
    s+='<path d="M'+boxX+' '+y+' h'+boxW+' v'+boxH+' h'+(-boxW)+' z" fill="none" stroke="'+COLS[i]+'" stroke-width="3"/>';
    s+='<path d="'+d+'" fill="none" stroke="'+COLS[i]+'" stroke-width="4"/>';
    if(i<bends-1 && bends>1) s+='<text x="'+(boxX+boxW/2)+'" y="'+(y+boxH+28)+'" text-anchor="middle" fill="'+INK+'" font-size="32" font-family="sans-serif">＋</text>';
  }
  if(sumP>0){
    const y=560;
    s+='<text x="'+(boxX+boxW/2)+'" y="'+(y-8)+'" text-anchor="middle" fill="'+INK+'" font-size="26" font-family="sans-serif">加起来</text>';
    const d=pathOf((x)=>sumAt(x,4,steep)*0.55, boxX, y, boxW, 90, 0, 1.6, sumP);
    s+='<path d="M'+boxX+' '+y+' h'+boxW+' v90 h'+(-boxW)+' z" fill="none" stroke="'+NAVY+'" stroke-width="3"/>';
    s+='<path d="'+d+'" fill="none" stroke="'+NAVY+'" stroke-width="4"/>';
    const pts=[[0.1,0.15],[0.35,0.7],[0.55,0.85],[0.8,0.35],[0.95,0.08]];
    for(let i=0;i<5;i++){
      if(sumP<0.15+i*0.1) continue;
      const px=boxX+8+pts[i][0]*(boxW-16);
      const py=y+90-8-(pts[i][1]/1.6)*74;
      s+='<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="6" fill="'+HL+'"/>';
    }
  }
  if(modelPlot){
    const X=x=>900+x*280, Y=y=>260-y*160;
    s+=axes(880,40,320,240);
    const pts=[[0,0],[0.25,0.7],[0.5,1],[0.75,0.45],[1,0]];
    const n=Math.min(pts.length, Math.ceil(modelPlot*pts.length));
    for(let i=0;i<n;i++) s+='<circle cx="'+X(pts[i][0])+'" cy="'+Y(pts[i][1])+'" r="8" fill="'+HL+'"/>';
    if(missLine>0){
      const x2=lerp(0,1,missLine);
      s+='<line x1="'+X(0)+'" y1="'+Y(0)+'" x2="'+X(x2)+'" y2="'+Y(x2*0.35)+'" stroke="'+NAVY+'" stroke-width="4"/>';
    }
  }
  if(colors>0){
    const dots=[[0,0,MARK],[120,0,LINK],[0,120,LINK],[120,120,MARK]];
    s+='<g transform="translate(70,520)">';
    dots.forEach(([x,y,c],i)=>{ if(colors>i*0.15) s+='<circle cx="'+x+'" cy="'+y+'" r="14" fill="'+c+'"/>'; });
    if(colors<0.7){
      s+='<line x1="0" y1="120" x2="120" y2="0" stroke="'+NAVY+'" stroke-width="4" opacity="0.8"/>';
    } else {
      s+='<path d="M0 80 Q60 8 120 80" fill="none" stroke="'+NAVY+'" stroke-width="4"/>';
    }
    s+='</g>';
  }
  return s;
}
function frame(model){
  let body='';
  if(model.kind==='chart'){
    body+=chart(model.w, model.b, model.points, model.line);
    body+=dial(980,220,70,model.w,-1,4,'左边 陡', model.hot==='w'||model.hot==='both');
    body+=dial(980,480,70,model.b,-1,4,'右边 起步', model.hot==='b'||model.hot==='both');
    if(model.loss!=null) body+='<text x="160" y="120" fill="'+INK+'" font-size="36" font-family="sans-serif">罚分 '+model.loss.toFixed(2)+'</text>';
  } else if(model.kind==='bowl'){
    body+=bowl(model.bx, model.trail, model.ring, model.draw);
    body+=dial(1040,240,64, model.kw, -1, 4, '旋钮 w', true);
    body+=dial(1040,480,64, model.kb, -1, 4, '旋钮 b', true);
  } else {
    body+=net(model.neurons, model.flow, model.bends, model.sum, model.steep, model.shift, model.colors, model.plot||0, model.miss||0);
  }
  body+='<text x="64" y="690" fill="'+INK+'" font-size="30" font-family="sans-serif">'+model.cap+'</text>';
  document.getElementById('s').innerHTML='<rect width="1280" height="720" fill="'+CARD+'"/>'+body;
}
window.render=frame;
</script>`;

function parseVtt(vtt) {
  const cues = [];
  const re = /(\d+):(\d+):(\d+)[,.](\d+)\s+-->\s+(\d+):(\d+):(\d+)[,.](\d+)\s+([\s\S]*?)(?=\n\n|\n*$)/g;
  let m;
  while ((m = re.exec(vtt))) {
    const a = +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000;
    const b = +m[5] * 3600 + +m[6] * 60 + +m[7] + +m[8] / 1000;
    const text = m[9].replace(/\s+/g, '').trim();
    if (text) cues.push({ a, b, text });
  }
  return cues;
}

function tts(text, mp3) {
  const r = spawnSync('edge-tts', ['--voice', 'zh-CN-XiaoxiaoNeural', '--rate=+25%', '--text', text, '--write-media', mp3], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || 'edge-tts failed');
}

function duration(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  return Number(r.stdout.trim());
}

const GAP = 0.2;

function speak(beats, work) {
  const spans = [];
  const files = [];
  let t = 0;
  beats.forEach((b, i) => {
    const mp3 = join(work, `s${i}.mp3`);
    tts(b.say, mp3);
    const d = duration(mp3);
    spans.push({ ...b, a: t, b: t + d, heard: b.say });
    files.push(mp3);
    t += d;
    if (i < beats.length - 1) { files.push('GAP'); t += GAP; }
  });
  return { spans, files, total: t };
}

function concatAudio(files, out) {
  const args = ['-y'];
  files.forEach((f) => {
    if (f === 'GAP') args.push('-f', 'lavfi', '-t', String(GAP), '-i', 'anullsrc=r=24000:cl=mono');
    else args.push('-i', f);
  });
  const parts = files.map((_, i) => `[${i}:a]aresample=24000,aformat=sample_fmts=fltp:channel_layouts=mono[a${i}]`).join(';');
  const cat = files.map((_, i) => `[a${i}]`).join('');
  args.push('-filter_complex', `${parts};${cat}concat=n=${files.length}:v=0:a=1[a]`, '-map', '[a]', '-c:a', 'aac', '-b:a', '64k', out);
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error((r.stderr || '').split('\n').slice(-20).join('\n'));
}

function writeVtt(spans, path) {
  const fmt = (t) => {
    const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`;
  };
  const body = spans.map((s, i) => `${i + 1}\n${fmt(s.a)} --> ${fmt(s.b)}\n${s.say}\n`).join('\n');
  writeFileSync(path, `WEBVTT\n\n${body}`);
}

function modelFor(key, scene, t, cap) {
  const e = ease(t);
  if (key === '2') {
    if (scene === 'drop') return { kind: 'chart', w: 0, b: 0, points: Math.min(3, 1 + Math.floor(t * 2.2)), line: t, loss: null, hot: '', cap };
    if (scene === 'flat') return { kind: 'chart', w: 0, b: Math.sin(t * Math.PI * 2) * 0.15, points: 3, line: t, loss: lossNum(0, 0), hot: '', cap };
    if (scene === 'steep') { const w = lerp(0, 2, e); return { kind: 'chart', w, b: 0, points: 3, line: 1, loss: lossNum(w, 0), hot: 'w', cap }; }
    if (scene === 'shift') { const b = lerp(0, 1, e); return { kind: 'chart', w: 2, b, points: 3, line: 1, loss: lossNum(2, b), hot: 'b', cap }; }
    if (scene === 'fit') { const w = lerp(1.2, 2, e), b = lerp(0.3, 1, e); return { kind: 'chart', w, b, points: 3, line: 1, loss: lossNum(w, b), hot: 'both', cap }; }
    if (scene === 'replayW') { const w = lerp(0, 2, t); return { kind: 'chart', w, b: 1, points: 3, line: 1, loss: lossNum(w, 1), hot: 'w', cap }; }
    if (scene === 'replayB') { const b = lerp(0, 1, t); return { kind: 'chart', w: 2, b, points: 3, line: 1, loss: lossNum(2, b), hot: 'b', cap }; }
    if (scene === 'bowl') return { kind: 'bowl', bx: -210 + Math.sin(t * Math.PI * 4) * 12, trail: [], ring: false, kw: 0, kb: 0, draw: e, cap };
    if (scene === 'roll') {
      const x = lerp(-210, -30, e);
      const trail = [];
      for (let i = 0; i < 8; i++) if (e > (i + 1) / 9) trail.push(lerp(-210, x, i / 8));
      return { kind: 'bowl', bx: x, trail, ring: true, kw: lerp(0, 1.4, e), kb: lerp(0, 0.6, e), cap };
    }
    if (scene === 'over') {
      const x = Math.sin(e * Math.PI * 2) * 160;
      return { kind: 'bowl', bx: x, trail: [-80, 40, x], ring: true, kw: 2.4, kb: 1.6, cap };
    }
    if (scene === 'rest') {
      const x = lerp(90, 0, e);
      return { kind: 'bowl', bx: x, trail: [120, 60, x], ring: true, kw: lerp(2.4, 2, e), kb: lerp(1.6, 1, e), cap };
    }
    if (scene === 'rest2') return { kind: 'bowl', bx: Math.sin(t * Math.PI * 2) * 90, trail: [-120, -40, 30, Math.sin(t * Math.PI * 2) * 90], ring: true, kw: 2 + Math.sin(t * Math.PI * 2) * 0.6, kb: 1, cap };
    const x = lerp(-160, 0, e);
    return { kind: 'bowl', bx: x, trail: [-200, -120, x], ring: true, kw: lerp(0.4, 2, e), kb: lerp(0.2, 1, e), cap };
  }
  const base = { kind: 'net', neurons: 0, flow: 0, bends: 0, sum: 0, steep: 1, shift: 0, colors: 0, cap };
  if (scene === 'rise') return { ...base, neurons: 1, flow: (t * 1.3) % 1, bends: 0, plot: e };
  if (scene === 'miss') return { ...base, neurons: 1, flow: (t * 1.3) % 1, bends: 0, plot: 1, miss: e };
  if (scene === 'n1') return { ...base, neurons: 1, flow: (t * 1.3) % 1, bends: 1 };
  if (scene === 'n2') return { ...base, neurons: 2, flow: (t * 1.3) % 1, bends: 2 };
  if (scene === 'n4') return { ...base, neurons: Math.min(4, 2 + Math.floor(t * 2.01)), flow: (t * 1.3) % 1, bends: Math.min(4, 2 + Math.floor(t * 2.01)) };
  if (scene === 'add') return { ...base, neurons: 4, flow: (t * 1.3) % 1, bends: 4, sum: e };
  if (scene === 'sit') return { ...base, neurons: 4, flow: (t * 1.3) % 1, bends: 4, sum: 0.35 + 0.65 * t };
  if (scene === 'turn') return { ...base, neurons: 4, flow: (t * 1.5) % 1, bends: 4, sum: 1, steep: lerp(0.55, 1.6, (Math.sin(t * Math.PI * 2) + 1) / 2), shift: Math.sin(t * Math.PI * 2) * 0.9 };
  if (scene === 'flow2') return { ...base, neurons: 4, flow: (t * 1.6) % 1, bends: 4, sum: 0.2 + 0.8 * t, steep: 0.8 + 0.5 * Math.sin(t * Math.PI * 2) };
  if (scene === 'color') return { ...base, neurons: 4, flow: (t * 1.3) % 1, bends: 4, sum: 1, colors: e, steep: 1 };
  return { ...base, neurons: t < 0.55 ? 4 : 2, flow: t, bends: t < 0.55 ? 4 : 1, sum: t < 0.55 ? 1 : 0, steep: t < 0.55 ? 1 : 0.15, colors: t < 0.55 ? 0.2 : 0 };
}

function lossNum(w, b) {
  const pts = [[1, 3], [2, 5], [3, 7]];
  return pts.reduce((s, [x, y]) => s + (w * x + b - y) ** 2, 0) / 3;
}

function motion(mp4) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', mp4, '-vf', 'fps=5,scale=160:90,format=rgb24', '-f', 'rawvideo', '-'], { maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error('motion extract failed');
  const buf = r.stdout;
  const n = 160 * 90 * 3;
  const frames = Math.floor(buf.length / n);
  const diffs = [];
  for (let i = 1; i < frames; i++) {
    let changed = 0;
    const a = i * n, b = (i - 1) * n;
    for (let p = 0; p < n; p += 3) {
      const d = Math.abs(buf[a + p] - buf[b + p]) + Math.abs(buf[a + p + 1] - buf[b + p + 1]) + Math.abs(buf[a + p + 2] - buf[b + p + 2]);
      if (d > 24) changed++;
    }
    diffs.push(changed);
  }
  const quiet = diffs.filter((d) => d < 12).length;
  let still = 0, worst = 0;
  for (let i = 0; i < diffs.length; i++) {
    still = diffs[i] < 12 ? still + 1 : 0;
    if (still > worst) worst = still;
  }
  return { frames, quiet, worstSec: worst / 5, min: Math.min(...diffs), median: diffs.slice().sort((a, b) => a - b)[Math.floor(diffs.length / 2)] };
}

const fps = 30;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await page.setContent(html);

for (const key of ['2', '3']) {
  const beats = BOARDS[key];
  const work = join(tmpdir(), 'si-sample-' + key);
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  const spoken = speak(beats, work);
  const spans = spoken.spans;
  const mp3 = join(work, 'a.m4a');
  concatAudio(spoken.files, mp3);
  console.log(key, 'speech', spoken.total.toFixed(1) + 's');
  if (spoken.total < 40 || spoken.total > 60) throw new Error(key + ' duration ' + spoken.total.toFixed(1) + 's is outside 40–60');
  writeFileSync(join(outDir, key + '.board.json'), JSON.stringify(spans.map((s) => ({ say: s.say, start: +s.a.toFixed(2), end: +s.b.toFixed(2), scene: s.scene, heard: s.heard })), null, 2));
  const dur = spans[spans.length - 1].b + 0.2;
  const n = Math.ceil(dur * fps);
  for (let i = 0; i < n; i++) {
    const time = i / fps;
    let beat = spans.find((s) => time >= s.a && time < s.b) || spans[spans.length - 1];
    const local = beat.b > beat.a ? clamp((time - beat.a) / (beat.b - beat.a), 0, 1) : 0;
    const cap = beat.say.replace(/。$/, '');
    await page.evaluate((m) => window.render(m), modelFor(key, beat.scene, local, cap));
    await page.locator('#s').screenshot({ path: join(work, String(i).padStart(4, '0') + '.png') });
    if (i % 150 === 0) console.log(key, 'frame', i, '/', n);
  }
  await page.locator('#s').screenshot({ path: join(outDir, key + '.jpg'), type: 'jpeg', quality: 72 });
  const mp4 = join(outDir, key + '.mp4');
  const ff = spawnSync('ffmpeg', ['-y', '-framerate', String(fps), '-i', join(work, '%04d.png'), '-i', mp3,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'baseline', '-level', '3.1',
    '-b:v', '520k', '-maxrate', '700k', '-bufsize', '1400k',
    '-c:a', 'aac', '-b:a', '64k', '-shortest', '-movflags', '+faststart', mp4], { encoding: 'utf8' });
  if (ff.status !== 0) throw new Error(ff.stderr.split('\n').slice(-30).join('\n'));
  writeVtt(spans, join(outDir, key + '.vtt'));
  const report = motion(mp4);
  console.log(key, 'motion', JSON.stringify(report));
  if (report.worstSec >= 5) throw new Error(key + ' has ' + report.worstSec.toFixed(1) + 's still');
  if (report.median < 18) throw new Error(key + ' median changed pixels ' + report.median);
  const size = Number(spawnSync('stat', ['-c', '%s', mp4], { encoding: 'utf8' }).stdout.trim());
  console.log(key, dur.toFixed(1) + 's', (size / 1048576).toFixed(2) + 'MB');
  if (size > 6 * 1048576) throw new Error(key + ' too big');
}
await browser.close();
