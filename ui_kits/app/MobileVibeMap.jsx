// Mobile-first version of the Vibe Map. No sidebar — bottom tab bar instead.

function MobileTopBar() {
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface)'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
        <div style={{width: 32, height: 32, borderRadius: 9, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: 16}}>P</div>
        <div>
          <div style={{fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', lineHeight: 1.1}}>Ciao Stefano</div>
          <div style={{fontSize: 14, fontWeight: 600, color: 'var(--text-primary)'}}>Continua il viaggio</div>
        </div>
      </div>
      <div style={{display: 'flex', gap: 6}}>
        <span style={{display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--surface-muted)', padding: '5px 9px', borderRadius: 9999, fontSize: 12, fontWeight: 700}}><span style={{color: 'var(--streak-fire)'}}>🔥</span>12</span>
        <span style={{display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--text-primary)', color: '#fff', padding: '5px 9px', borderRadius: 9999, fontSize: 12, fontWeight: 700}}><span style={{color: 'var(--xp-gold)'}}>⚡</span>1840</span>
      </div>
    </div>
  );
}

function MobileTabBar({active}) {
  const tabs = [
    {id: 'map', icon: '🗺', label: 'Mappa'},
    {id: 'practice', icon: '✎', label: 'Pratica'},
    {id: 'progress', icon: '⏶', label: 'Progressi'},
    {id: 'me', icon: '◉', label: 'Tu'},
  ];
  return (
    <div style={{display: 'flex', borderTop: '1px solid var(--border)', background: 'var(--surface)', paddingBottom: 8}}>
      {tabs.map(t => (
        <button key={t.id} style={{flex: 1, background: 'transparent', border: 0, padding: '10px 0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: t.id === active ? 'var(--primary)' : 'var(--text-muted)', fontWeight: t.id === active ? 700 : 500, fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer'}}>
          <span style={{fontSize: 18}}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function MobileVibeMap({onLesson}) {
  const W = 360;
  const biomes = [
    {n: 1, name: 'The Mindset', tier: 'FREE', accent: '#C97C5E', icon: '../../assets/icon-path-mindset.svg', bg: '../../assets/biome-mindset.svg', trail: '#A23E12', height: 360, phase: 0,
      lessons: [
        {n: 1, title: 'Why prompts beat code', state: 'done'},
        {n: 2, title: 'How AI thinks', state: 'done'},
        {n: 3, title: 'Your first idea', state: 'done'},
        {n: 4, title: 'Talk like a builder', state: 'done'},
        {n: 5, title: 'Habits, not heroics', state: 'done'},
        {n: 6, title: 'Checkpoint', state: 'done'},
      ],
    },
    {n: 2, name: 'The Prompt', tier: 'FREE', accent: '#345B5A', icon: '../../assets/icon-path-prompt.svg', iconInvert: true, bg: '../../assets/biome-prompt.svg', trail: '#F59E0B', height: 420, phase: 1.4,
      lessons: [
        {n: 7, title: 'Anatomy of a prompt', state: 'done'},
        {n: 8, title: 'Specificity wins', state: 'done'},
        {n: 9, title: 'Context is half', state: 'done'},
        {n: 10, title: 'Iterating', state: 'active'},
        {n: 11, title: 'Roles & limits', state: 'next'},
        {n: 12, title: 'When AI is wrong', state: 'locked'},
        {n: 13, title: 'Examples', state: 'locked'},
        {n: 14, title: 'Putting it together', state: 'locked'},
      ],
    },
    {n: 3, name: 'Build', tier: 'PRO', accent: '#373B3D', icon: '../../assets/icon-path-build.svg', iconInvert: true, bg: '../../assets/biome-build.svg', trail: '#E8703F', height: 380, phase: 2.6,
      lessons: [
        {n: 15, title: 'Landing page', state: 'locked'},
        {n: 16, title: 'Layout in plain English', state: 'locked'},
        {n: 17, title: 'Buttons that do things', state: 'locked'},
        {n: 18, title: 'A useful tool', state: 'locked'},
        {n: 19, title: 'Make it yours', state: 'locked'},
      ],
    },
    {n: 4, name: 'Debug', tier: 'PRO', accent: '#5A4220', icon: '../../assets/icon-path-debug.svg', iconInvert: true, bg: '../../assets/biome-debug.svg', trail: '#E8703F', height: 340, phase: 3.8,
      lessons: [
        {n: 20, title: 'Read AI output', state: 'locked'},
        {n: 21, title: 'Failure modes', state: 'locked'},
        {n: 22, title: 'Better follow-ups', state: 'locked'},
        {n: 23, title: 'When to restart', state: 'locked'},
      ],
    },
    {n: 5, name: 'Ship', tier: 'PRO', accent: '#E5A883', icon: '../../assets/icon-path-ship.svg', bg: '../../assets/biome-ship.svg', trail: '#FFC78A', height: 380, phase: 5.0,
      lessons: [
        {n: 24, title: 'Pick what to ship', state: 'locked'},
        {n: 25, title: 'Naming & copy', state: 'locked'},
        {n: 26, title: 'Put it online', state: 'locked'},
        {n: 27, title: 'First launch 🚀', state: 'locked'},
      ],
    },
  ];

  return (
    <div style={{flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--background)', WebkitOverflowScrolling: 'touch'}}>
      <style>{`@keyframes mapPulseM { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(1.7);opacity:0} }`}</style>
      {/* Overall progress card */}
      <div style={{padding: '14px 16px 8px'}}>
        <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)'}}>
          <div style={{flex: 1}}>
            <div style={{fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase'}}>YOUR JOURNEY</div>
            <div style={{fontSize: 13.5, fontWeight: 600}}>9 of 30 lessons</div>
          </div>
          <div style={{width: 90, height: 7, background: 'var(--surface-muted)', borderRadius: 9999, overflow: 'hidden'}}>
            <div style={{width: '30%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--primary-hover))'}}/>
          </div>
        </div>
      </div>

      {biomes.map(b => {
        const cols = b.lessons.length;
        const nodes = b.lessons.map((l, i) => {
          const t = (i + 0.5) / cols;
          const y = 60 + t * (b.height - 100);
          const x = W/2 + Math.sin(i * 1.1 + b.phase) * 95;
          return {...l, x, y};
        });
        let d = `M ${nodes[0].x} ${nodes[0].y}`;
        for (let i = 1; i < nodes.length; i++) {
          const p0 = nodes[i-1], p1 = nodes[i];
          const cy = (p0.y + p1.y) / 2;
          d += ` Q ${p0.x} ${cy}, ${(p0.x + p1.x)/2} ${cy} T ${p1.x} ${p1.y}`;
        }
        return (
          <section key={b.n} style={{position: 'relative', width: '100%', height: b.height, marginBottom: 0}}>
            <img src={b.bg} alt="" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}}/>
            <div style={{position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(6px)', padding: '6px 11px 6px 7px', borderRadius: 9999, boxShadow: 'var(--shadow-sm)', zIndex: 4}}>
              <div style={{width: 26, height: 26, borderRadius: 7, background: b.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <img src={b.icon} style={{height: 16, filter: b.iconInvert ? 'brightness(0) invert(1)' : 'none'}}/>
              </div>
              <div>
                <div style={{fontSize: 8.5, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', lineHeight: 1.2}}>Path {b.n} · {b.tier}</div>
                <div style={{fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', lineHeight: 1.1}}>{b.name}</div>
              </div>
            </div>
            <div style={{position: 'absolute', top: 16, right: 12, background: 'rgba(17,24,39,.85)', color: '#fff', padding: '4px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, zIndex: 4}}>
              {b.lessons.filter(l => l.state === 'done').length}/{b.lessons.length}
            </div>
            <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
              <path d={d} stroke={b.trail} strokeWidth="5" strokeLinecap="round" strokeDasharray="2 10" fill="none" opacity=".6"/>
            </svg>
            {nodes.map(node => {
              const states = {
                done:   {bg: '#16A34A', icon: '✓', text: '#fff'},
                active: {bg: 'var(--primary)', icon: '▶', text: '#fff'},
                next:   {bg: '#FFF', icon: node.n, text: 'var(--primary-deep)', border: '2px dashed var(--primary)'},
                locked: {bg: 'rgba(255,255,255,.6)', icon: '🔒', text: '#7A4226', border: '1px solid rgba(122,66,38,.25)'},
              };
              const s = states[node.state];
              const size = node.state === 'active' ? 56 : 48;
              return (
                <button key={node.n} onClick={() => node.state !== 'locked' && onLesson(node)}
                  style={{position: 'absolute', left: node.x - size/2, top: node.y - size/2, width: size, height: size, borderRadius: '50%', background: s.bg, color: s.text, border: s.border || 0, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, cursor: 'pointer', boxShadow: node.state === 'active' ? '0 0 0 5px rgba(232,112,63,.30), 0 6px 14px rgba(17,24,39,.18)' : node.state === 'locked' ? 'none' : '0 3px 10px rgba(17,24,39,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5}}>
                  {node.state === 'active' && <span style={{position: 'absolute', inset: -6, borderRadius: '50%', border: '3px solid var(--primary)', opacity: 0, animation: 'mapPulseM 2s ease-out infinite'}}/>}
                  {s.icon}
                  {node.state === 'active' && (
                    <div style={{position: 'absolute', top: -34, left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#fff', padding: '4px 10px', borderRadius: 9999, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap'}}>You are here</div>
                  )}
                </button>
              );
            })}
          </section>
        );
      })}
      <div style={{padding: '20px 16px 30px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)'}}>
        Tap any unlocked node to start that lesson.
      </div>
    </div>
  );
}

window.MobileVibeMap = MobileVibeMap;
window.MobileTopBar = MobileTopBar;
window.MobileTabBar = MobileTabBar;
