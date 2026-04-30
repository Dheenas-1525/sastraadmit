/* ── Cursor (desktop only) ── */
const dot = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
if (isTouch) {
  if (dot)  dot.style.display  = 'none';
  if (ring) ring.style.display = 'none';
  document.body.style.cursor = '';
} else {
  let mx=0, my=0, rx=0, ry=0;
  document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });
  (function animCursor() {
    dot.style.left  = mx + 'px'; dot.style.top  = my + 'px';
    rx += (mx - rx) * 0.1;  ry += (my - ry) * 0.1;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animCursor);
  })();
  document.querySelectorAll('a,button,.feat-card,.q-card').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.style.width='56px'; ring.style.height='56px'; ring.style.borderColor='rgba(29,78,216,0.8)'; });
    el.addEventListener('mouseleave', () => { ring.style.width='36px'; ring.style.height='36px'; ring.style.borderColor='rgba(29,78,216,0.5)'; });
  });
}

/* ── Canvas Particles ── */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [];
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize(); window.addEventListener('resize', resize);

function mkParticle() {
  return {
    x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*1.5+.3,
    vx: (Math.random()-.5)*.25, vy: (Math.random()-.5)*.25,
    op: Math.random()*.5+.1,
    col: Math.random() > .7 ? '29,78,216' : '59,130,246'
  };
}
const particleCount = isTouch ? 40 : 110;
for(let i=0;i<particleCount;i++) particles.push(mkParticle());

function drawCanvas() {
  ctx.clearRect(0,0,W,H);
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = `rgba(${p.col},${p.op})`;
    ctx.fill();
    p.x += p.vx; p.y += p.vy;
    if(p.x<0||p.x>W) p.vx *= -1;
    if(p.y<0||p.y>H) p.vy *= -1;
  });
  // draw connections
  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      let dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
      let dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<90){
        ctx.beginPath();
        ctx.moveTo(particles[i].x,particles[i].y);
        ctx.lineTo(particles[j].x,particles[j].y);
        ctx.strokeStyle=`rgba(29,78,216,${.04*(1-dist/90)})`;
        ctx.lineWidth=.5; ctx.stroke();
      }
    }
  }
  requestAnimationFrame(drawCanvas);
}
drawCanvas();

/* ── Rotating Quotes ── */
const quotes = [
  { text:"Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author:"— Malcolm X" },
  { text:"The function of education is to teach one to think intensively and to think critically.", author:"— Martin Luther King Jr." },
  { text:"An investment in knowledge pays the best interest.", author:"— Benjamin Franklin" },
  { text:"The beautiful thing about learning is that no one can take it away from you.", author:"— B.B. King" },
  { text:"Education is not preparation for life; education is life itself.", author:"— John Dewey" },
];
let qi=0;
const qEl = document.getElementById('rotating-quote');
const aEl = document.getElementById('quote-author');
const dotsCont = document.getElementById('quote-dots');

quotes.forEach((_,i)=>{
  const d = document.createElement('div');
  d.className='q-dot'+(i===0?' active':'');
  d.addEventListener('click',()=>goQuote(i));
  dotsCont.appendChild(d);
});

function goQuote(i){
  qEl.classList.add('fade-out'); aEl.style.opacity='0';
  setTimeout(()=>{
    qi=i; qEl.textContent=quotes[qi].text; aEl.textContent=quotes[qi].author;
    qEl.classList.remove('fade-out'); qEl.classList.add('fade-in');
    aEl.style.opacity='0.7';
    document.querySelectorAll('.q-dot').forEach((d,idx)=>d.classList.toggle('active',idx===qi));
  },500);
}
setInterval(()=>goQuote((qi+1)%quotes.length),4500);

/* ── Counter Anim ── */
function animCount(el, target, dur=1800){
  let start=0, t0=null;
  function step(ts){ if(!t0)t0=ts; let p=Math.min((ts-t0)/dur,1); el.textContent=Math.round(p*target); if(p<1)requestAnimationFrame(step); }
  requestAnimationFrame(step);
}
const counters = document.querySelectorAll('[data-target]');
let counted=false;
function checkCounters(){
  if(counted)return;
  const trigger = document.querySelector('.stats-strip');
  if(!trigger)return;
  const rect = trigger.getBoundingClientRect();
  if(rect.top < window.innerHeight*.9){
    counted=true;
    counters.forEach(c=>animCount(c,+c.dataset.target));
  }
}

/* ── Scroll Reveal ── */
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('visible'); }
  });
},{threshold:.12});
reveals.forEach(r=>observer.observe(r));
window.addEventListener('scroll', checkCounters, {passive:true});
checkCounters();

/* ── Parallax glow on mouse ── */
document.addEventListener('mousemove', e=>{
  const xp = (e.clientX/window.innerWidth-.5)*30;
  const yp = (e.clientY/window.innerHeight-.5)*20;
  document.querySelector('.glow-1').style.transform=`translateX(calc(-50% + ${xp}px)) translateY(${yp}px)`;
});