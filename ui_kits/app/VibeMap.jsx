// Vibe-coding lesson map — single regular serpentine path through 5 biomes.
// - Equidistant lessons along a sine wave
// - Robot avatar (idle bob) on the active node
// - Hover preview cards
// - Bonus side-quests floated into the empty space between curves with neon radar
// - Responsive: SVG viewBox + CSS grid scales for desktop & mobile

const BIOMES = [
  {
    n: 1, name: 'The Mindset', tier: 'FREE', accent: '#C97C5E',
    icon: '../../assets/icon-path-mindset.svg', bg: '../../assets/biome-mindset.svg',
    trail: '#A23E12', neon: '#7DF9FF',
    fadeTop: 'transparent', fadeBottom: 'rgba(166,168,155,.4)',
    main: [
      {n: 1, title: 'Why prompts beat code',     mins: 5, xp: 60, state: 'done',   blurb: 'The single shift in how you think about software.'},
      {n: 2, title: 'How AI actually thinks',    mins: 7, xp: 80, state: 'done',   blurb: 'A non-technical mental model that won\'t mislead you.'},
      {n: 3, title: 'Your first idea',           mins: 6, xp: 60, state: 'done',   blurb: 'From "I wish this existed" to a one-line spec.'},
      {n: 4, title: 'Talking like a builder',    mins: 8, xp: 80, state: 'done',   blurb: 'The vocabulary makers use, in plain English.'},
      {n: 5, title: 'Habits, not heroics',       mins: 6, xp: 60, state: 'done',   blurb: 'Five minutes a day beats five hours on Sunday.'},
      {n: 6, title: 'Wrap-up & checkpoint',      mins: 5, xp: 100, state: 'done',  blurb: 'Quick reflection before the next path.'},
    ],
    bonus: [
      {n: 'B1', title: 'Mindset reset', mins: 4, xp: 40, state: 'bonus',  blurb: 'A 4-minute pep talk for when momentum dips.', after: 3},
    ],
  },
  {
    n: 2, name: 'The Prompt', tier: 'FREE', accent: '#345B5A',
    icon: '../../assets/icon-path-prompt.svg', iconInvert: true, bg: '../../assets/biome-prompt.svg',
    trail: '#F59E0B', neon: '#A6FF00',
    fadeTop: 'rgba(166,168,155,.4)', fadeBottom: 'rgba(221,216,210,.4)',
    main: [
      {n: 7,  title: 'Anatomy of a prompt',       mins: 9, xp: 100, state: 'done',   blurb: 'Role, context, ask, format — the four bones.'},
      {n: 8,  title: 'Specificity beats cleverness', mins: 7, xp: 80, state: 'done', blurb: 'Why boring prompts win every time.'},
      {n: 9,  title: 'Context is half the answer',  mins: 8, xp: 80, state: 'done',  blurb: 'Feeding the model the right surroundings.'},
      {n: 10, title: 'Iterating without restart',   mins: 8, xp: 90, state: 'active', blurb: 'Refining mid-conversation instead of starting over.'},
      {n: 11, title: 'Roles & constraints',         mins: 9, xp: 90, state: 'next',  blurb: 'Pin the AI down so it can\'t wander.'},
      {n: 12, title: 'When AI gets it wrong',       mins: 7, xp: 80, state: 'locked', blurb: 'Spotting the three classic failure shapes.'},
      {n: 13, title: 'Examples that teach',         mins: 8, xp: 90, state: 'locked', blurb: 'Showing, not telling — the few-shot trick.'},
      {n: 14, title: 'Putting it together',         mins: 12, xp: 120, state: 'locked', blurb: 'Build a reusable prompt template you actually use.'},
    ],
    bonus: [
      {n: 'B2', title: 'Steal this prompt', mins: 5, xp: 50, state: 'locked', blurb: 'Five copy-paste prompts that punch above their weight.', after: 11},
    ],
  },
  {
    n: 3, name: 'Build', tier: 'PRO', accent: '#373B3D',
    icon: '../../assets/icon-path-build.svg', iconInvert: true, bg: '../../assets/biome-build.svg',
    trail: '#E8703F', neon: '#FF4D8B',
    fadeTop: 'rgba(221,216,210,.4)', fadeBottom: 'rgba(184,161,128,.4)',
    main: [
      {n: 15, title: 'Your first landing page',          mins: 12, xp: 130, state: 'locked', blurb: 'Zero to live page in twelve minutes.'},
      {n: 16, title: 'Layout in plain English',          mins: 10, xp: 100, state: 'locked', blurb: 'Describing UI without saying "div".'},
      {n: 17, title: 'Buttons that actually do things',  mins: 11, xp: 110, state: 'locked', blurb: 'Wiring interactivity through prompts.'},
      {n: 18, title: 'A small useful tool',              mins: 14, xp: 140, state: 'locked', blurb: 'Build something you\'ll genuinely use tomorrow.'},
      {n: 19, title: 'Making it look like yours',        mins: 9, xp: 90,  state: 'locked', blurb: 'Type, color, vibe — making it not feel generic.'},
      {n: 20, title: 'Forms & state',                    mins: 11, xp: 110, state: 'locked', blurb: 'Capturing input without breaking everything.'},
    ],
    bonus: [
      {n: 'B3', title: 'Steal this stack', mins: 5, xp: 60, state: 'locked', blurb: 'The exact stack we recommend for first builds.', after: 17},
    ],
  },
  {
    n: 4, name: 'Debug', tier: 'PRO', accent: '#5A4220',
    icon: '../../assets/icon-path-debug.svg', iconInvert: true, bg: '../../assets/biome-debug.svg',
    trail: '#E8703F', neon: '#FFB400',
    fadeTop: 'rgba(184,161,128,.4)', fadeBottom: 'rgba(44,47,51,.4)',
    main: [
      {n: 21, title: 'Reading what AI gave you',  mins: 8, xp: 90, state: 'locked', blurb: 'Skim-reading code without panic.'},
      {n: 22, title: 'Common failure modes',      mins: 9, xp: 100, state: 'locked', blurb: 'The five bugs you\'ll hit ninety percent of the time.'},
      {n: 23, title: 'Asking better follow-ups',  mins: 8, xp: 90, state: 'locked', blurb: 'Turning a broken output into a fix in one message.'},
      {n: 24, title: 'When to start over',        mins: 7, xp: 80, state: 'locked', blurb: 'Knowing when reset is faster than repair.'},
      {n: 25, title: 'Rubber-duck the AI',        mins: 9, xp: 100, state: 'locked', blurb: 'Explaining the bug to the model — and to yourself.'},
    ],
    bonus: [],
  },
  {
    n: 5, name: 'Ship', tier: 'PRO', accent: '#E5A883',
    icon: '../../assets/icon-path-ship.svg', bg: '../../assets/biome-ship.svg',
    trail: '#FFC78A', neon: '#7DF9FF',
    fadeTop: 'rgba(44,47,51,.4)', fadeBottom: 'transparent',
    main: [
      {n: 26, title: 'Picking what to ship',         mins: 10, xp: 120, state: 'locked', blurb: 'Cut, don\'t polish. The smallest valuable slice.'},
      {n: 27, title: 'Naming, copy, the lot',        mins: 9,  xp: 100, state: 'locked', blurb: 'A name and a tagline in under nine minutes.'},
      {n: 28, title: 'Putting it on the internet',   mins: 12, xp: 140, state: 'locked', blurb: 'Domain, deploy, done. No more localhost.'},
      {n: 29, title: 'Showing it to one person',     mins: 8,  xp: 100, state: 'locked', blurb: 'Why "one user" beats "the world".'},
      {n: 30, title: 'Your first launch',            mins: 12, xp: 200, state: 'locked', blurb: 'Press the button. We\'ll be there.'},
    ],
    bonus: [
      {n: 'B4', title: 'Launch checklist', mins: 4, xp: 60, state: 'locked', blurb: 'The fifteen things to verify before you tweet.', after: 28},
    ],
  },
];

// ─── Robot avatar (img + idle bob animation) ─────────────────────────
function RobotAvatar({size = 64}) {
  return (
    <div style={{
      width: size, height: size * (96/80), position: 'relative',
      animation: 'robotBob 2.6s ease-in-out infinite',
    }}>
      <img src="../../assets/avatar-robot.svg" alt="You"
        style={{width: '100%', height: '100%', display: 'block', filter: 'drop-shadow(0 6px 10px rgba(17,24,39,.28))'}}/>
    </div>
  );
}

// ─── Lesson node (main path) ─────────────────────────────────────────
function LessonNode({lesson, onClick, hovered, setHovered}) {
  const {state, n, locked} = lesson;
  const isActive = state === 'active';
  const styles = {
    done:   {bg: '#16A34A', text: '#fff',  icon: '✓', ring: 'rgba(22,163,74,.22)'},
    active: {bg: 'transparent', text: 'transparent', icon: null, ring: 'rgba(232,112,63,.32)'},
    next:   {bg: '#FFFFFF', text: 'var(--primary-deep)', icon: n, ring: 'rgba(232,112,63,.16)', border: '2px dashed var(--primary)'},
    locked: {bg: 'rgba(255,255,255,.55)', text: '#7A4226', icon: '🔒', ring: 'transparent', border: '1px solid rgba(122,66,38,.25)'},
  };
  const s = styles[state] || styles.locked;
  const size = isActive ? 72 : 56;

  return (
    <button
      onClick={() => !locked && onClick(lesson)}
      disabled={locked}
      onMouseEnter={() => setHovered(lesson)}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered(lesson)}
      onBlur={() => setHovered(null)}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: s.bg, border: s.border || 0, color: s.text,
        fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 19,
        cursor: locked ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isActive ? 'none'
          : state === 'locked' ? 'none'
          : `0 0 0 6px ${s.ring}, 0 6px 14px rgba(17,24,39,.16)`,
        transition: 'transform .15s ease',
        position: 'relative',
        padding: 0,
      }}
      onMouseDown={e => !locked && (e.currentTarget.style.transform = 'scale(0.94)')}
      onMouseUp={e => (e.currentTarget.style.transform = '')}
    >
      {isActive && (
        <>
          <span style={{
            position: 'absolute', inset: -10, borderRadius: '50%',
            border: '3px solid var(--primary)', opacity: 0,
            animation: 'mapPulse 2.2s ease-out infinite', pointerEvents: 'none',
          }}/>
          <RobotAvatar size={size + 6}/>
        </>
      )}
      {!isActive && <span style={{lineHeight: 1}}>{s.icon}</span>}
    </button>
  );
}

// ─── Bonus node — futuristic hex badge with neon radar ───────────────
function BonusBadge({lesson, onClick, hovered, setHovered, neon}) {
  const locked = lesson.state === 'locked';
  return (
    <button
      onClick={() => !locked && onClick(lesson)}
      disabled={locked}
      onMouseEnter={() => setHovered(lesson)}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered(lesson)}
      onBlur={() => setHovered(null)}
      style={{
        width: 64, height: 72, position: 'relative', padding: 0, border: 0,
        background: 'transparent', cursor: locked ? 'default' : 'pointer',
      }}
    >
      {/* radar pulse — neon, subtler than active node */}
      <span style={{
        position: 'absolute', inset: 4, borderRadius: '50%',
        border: `2px solid ${neon}`, opacity: 0,
        animation: 'bonusRadar 2.8s ease-out infinite', pointerEvents: 'none',
        filter: `drop-shadow(0 0 6px ${neon})`,
      }}/>
      {/* hex shell */}
      <svg viewBox="0 0 64 72" width="64" height="72" style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id={`bg-${lesson.n}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#1B1F23"/>
            <stop offset="1" stopColor="#0B0D10"/>
          </linearGradient>
          <linearGradient id={`gold-${lesson.n}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#FFD27A"/>
            <stop offset="1" stopColor="#B69337"/>
          </linearGradient>
        </defs>
        {/* outer hex */}
        <polygon points="32,2 60,18 60,54 32,70 4,54 4,18"
          fill={`url(#bg-${lesson.n})`}
          stroke={neon} strokeWidth="1.6"
          style={{filter: `drop-shadow(0 0 5px ${neon}) drop-shadow(0 4px 8px rgba(0,0,0,.35))`}}/>
        {/* inner hex */}
        <polygon points="32,9 53,21 53,51 32,63 11,51 11,21"
          fill="none" stroke={neon} strokeWidth="0.8" opacity="0.45"/>
        {/* corner ticks */}
        <g stroke={neon} strokeWidth="1.2" opacity="0.85">
          <line x1="32" y1="2" x2="32" y2="6"/>
          <line x1="32" y1="66" x2="32" y2="70"/>
          <line x1="6" y1="20" x2="10" y2="22"/>
          <line x1="58" y1="20" x2="54" y2="22"/>
          <line x1="6" y1="52" x2="10" y2="50"/>
          <line x1="58" y1="52" x2="54" y2="50"/>
        </g>
        {/* center glyph: star or lock */}
        {locked ? (
          <g transform="translate(32 38)">
            <rect x="-8" y="-3" width="16" height="13" rx="2" fill="#F4EDE4" stroke="#1B1F23" strokeWidth="1"/>
            <path d="M -5 -3 V -7 a 5 5 0 0 1 10 0 V -3" fill="none" stroke="#F4EDE4" strokeWidth="2"/>
            <circle cx="0" cy="3" r="1.6" fill="#1B1F23"/>
          </g>
        ) : (
          <g transform="translate(32 38)">
            <path d="M0,-11 L3,-3 L11,-3 L4.5,2 L7,10 L0,5 L-7,10 L-4.5,2 L-11,-3 L-3,-3 Z"
              fill={`url(#gold-${lesson.n})`} stroke="#FFE9B5" strokeWidth="0.8"/>
          </g>
        )}
        {/* "BONUS" label */}
        <text x="32" y="22" textAnchor="middle"
          fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          fontSize="6.5" fontWeight="700" fill={neon} letterSpacing="0.2em" opacity="0.95">BONUS</text>
        <text x="32" y="58" textAnchor="middle"
          fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          fontSize="6" fontWeight="700" fill={neon} letterSpacing="0.15em" opacity="0.7">{lesson.n}</text>
      </svg>
    </button>
  );
}

// ─── Hover preview popover ───────────────────────────────────────────
function HoverCard({lesson, x, y, biomeName, side = 'top', containerW = 1080}) {
  if (!lesson) return null;
  const {title, mins, xp, state, blurb, n} = lesson;
  const stateLabel = {
    done:   {label: 'Completed', color: '#16A34A'},
    active: {label: 'In progress', color: 'var(--primary)'},
    next:   {label: 'Up next', color: 'var(--primary-deep)'},
    locked: {label: 'Locked', color: 'var(--text-muted)'},
    bonus:  {label: 'Bonus side-quest', color: '#B69337'},
  }[state] || {label: '', color: 'var(--text-muted)'};

  // Compute placement based on side
  let top, left, transform, arrow;
  const cardW = 240;
  if (side === 'top') {
    top = y - 14; left = x;
    transform = 'translate(-50%, -100%)';
    arrow = {bottom: -6, left: '50%', marginLeft: -6, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #fff'};
  } else if (side === 'bottom') {
    top = y + 60; left = x;
    transform = 'translate(-50%, 0)';
    arrow = {top: -6, left: '50%', marginLeft: -6, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid #fff'};
  } else if (side === 'left') {
    top = y; left = x - 50;
    transform = 'translate(-100%, -50%)';
    arrow = {right: -6, top: '50%', marginTop: -6, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '6px solid #fff'};
  } else { // right
    top = y; left = x + 50;
    transform = 'translate(0, -50%)';
    arrow = {left: -6, top: '50%', marginTop: -6, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '6px solid #fff'};
  }
  // Clamp horizontally inside container
  const halfW = cardW / 2;
  if (side === 'top' || side === 'bottom') {
    const minX = halfW + 8;
    const maxX = containerW - halfW - 8;
    left = Math.max(minX, Math.min(maxX, left));
  }

  return (
    <div role="tooltip" style={{
      position: 'absolute', left, top, transform,
      width: cardW, background: '#fff',
      border: '1px solid rgba(17,24,39,.10)',
      borderRadius: 14,
      boxShadow: '0 14px 30px rgba(17,24,39,.18), 0 2px 6px rgba(17,24,39,.08)',
      padding: '12px 14px',
      pointerEvents: 'none',
      zIndex: 50,
      fontFamily: 'var(--font-body)',
      animation: 'hoverFade .18s ease-out',
    }}>
      <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6}}>
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: 9999,
          background: stateLabel.color,
        }}/>
        <span style={{fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          color: stateLabel.color, textTransform: 'uppercase'}}>
          {stateLabel.label}
        </span>
        <span style={{marginLeft: 'auto', fontSize: 10, fontWeight: 600,
          color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em'}}>
          {biomeName} · {String(n).padStart(2, '0')}
        </span>
      </div>
      <div style={{
        fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700,
        color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: 4,
      }}>{title}</div>
      <div style={{fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8}}>
        {blurb}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 11,
        color: 'var(--text-muted)', fontWeight: 600}}>
        <span>⏱ {mins} min</span>
        <span style={{color: 'var(--xp-gold-deep, #B69337)'}}>⚡ {xp} XP</span>
      </div>
      {/* arrow */}
      <div style={{
        position: 'absolute',
        ...arrow,
        width: 0, height: 0,
      }}/>
    </div>
  );
}

// ─── Single regular serpentine biome band ────────────────────────────
function BiomeBand({biome, onLesson}) {
  const containerRef = React.useRef(null);
  const [hovered, setHovered] = React.useState(null);
  const [width, setWidth] = React.useState(1080);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const isVertical = width < 640;

  // Layout math — equidistant nodes along a regular sine wave.
  // In horizontal mode, x is the "long" axis and y oscillates.
  // In vertical mode (mobile), y is the long axis and x oscillates.
  const N = biome.main.length;
  let mainNodes, bonusNodes, pathD, height;

  if (!isVertical) {
    const padX = Math.max(48, width * 0.06);
    const usableW = width - padX * 2;
    const spacingX = usableW / (N - 1 || 1);
    const amplitude = Math.min(96, width * 0.085);
    const waves = Math.max(1, Math.round(N / 4));
    const omega = (waves * 2 * Math.PI) / (usableW);
    const phase = biome.n * 0.6;
    const centerY = amplitude + 90;
    height = centerY + amplitude + 80;

    mainNodes = biome.main.map((l, i) => {
      const x = padX + i * spacingX;
      const y = centerY + Math.sin(omega * (x - padX) + phase) * amplitude;
      return {...l, x, y};
    });

    bonusNodes = biome.bonus.map(b => {
      const idx = Math.max(0, biome.main.findIndex(m => m.n === b.after));
      const x0 = padX + idx * spacingX;
      const x1 = padX + (idx + 1 < N ? idx + 1 : idx) * spacingX;
      const x = (x0 + x1) / 2;
      const yMain = centerY + Math.sin(omega * (x - padX) + phase) * amplitude;
      const dir = yMain > centerY ? -1 : 1;
      const y = centerY + dir * (amplitude + 36);
      return {...b, x, y};
    });

    const samples = 80;
    pathD = '';
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = padX + t * usableW;
      const y = centerY + Math.sin(omega * (x - padX) + phase) * amplitude;
      pathD += (i === 0 ? 'M' : 'L') + ` ${x.toFixed(1)} ${y.toFixed(1)} `;
    }
  } else {
    // Vertical serpentine — y is the long axis
    const padY = 100; // room for biome pill at top
    const padBottom = 60;
    const spacingY = 110; // distance between consecutive lessons along Y
    const usableH = N > 1 ? (N - 1) * spacingY : spacingY;
    const amplitude = Math.min((width - 80) / 2, 120);
    const centerX = width / 2;
    const waves = Math.max(1, Math.round(N / 3));
    const omega = (waves * 2 * Math.PI) / (usableH);
    const phase = biome.n * 0.6;
    height = padY + usableH + padBottom;

    mainNodes = biome.main.map((l, i) => {
      const y = padY + i * spacingY;
      const x = centerX + Math.sin(omega * (y - padY) + phase) * amplitude;
      return {...l, x, y};
    });

    bonusNodes = biome.bonus.map(b => {
      const idx = Math.max(0, biome.main.findIndex(m => m.n === b.after));
      const y0 = padY + idx * spacingY;
      const y1 = padY + (idx + 1 < N ? idx + 1 : idx) * spacingY;
      const y = (y0 + y1) / 2;
      const xMain = centerX + Math.sin(omega * (y - padY) + phase) * amplitude;
      const dir = xMain > centerX ? -1 : 1;
      const x = centerX + dir * (amplitude + 30);
      return {...b, x, y};
    });

    const samples = 90;
    pathD = '';
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const y = padY + t * usableH;
      const x = centerX + Math.sin(omega * (y - padY) + phase) * amplitude;
      pathD += (i === 0 ? 'M' : 'L') + ` ${x.toFixed(1)} ${y.toFixed(1)} `;
    }
  }

  const centerY = !isVertical ? height / 2 : 0;
  const centerX = isVertical ? width / 2 : 0;

  const lastDoneIdx = (() => {
    let last = -1;
    biome.main.forEach((l, i) => { if (l.state === 'done' || l.state === 'active') last = i; });
    return last;
  })();
  const progressT = N > 1 ? Math.max(0, lastDoneIdx) / (N - 1) : 0;

  return (
    <section ref={containerRef}
      style={{position: 'relative', width: '100%', height, overflow: 'hidden'}}>
      {/* Biome background */}
      <img src={biome.bg} alt=""
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}}/>
      <div style={{position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, ${biome.fadeTop} 0%, transparent 12%, transparent 88%, ${biome.fadeBottom} 100%)`}}/>

      {/* Biome header pill */}
      <div style={{position: 'absolute', top: 14, left: 12, display: 'inline-flex',
        alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.92)',
        backdropFilter: 'blur(8px)',
        padding: isVertical ? '6px 10px 6px 8px' : '8px 14px 8px 10px',
        borderRadius: 9999,
        boxShadow: '0 4px 12px rgba(17,24,39,.10)', zIndex: 4,
        maxWidth: 'calc(100% - 80px)'}}>
        <div style={{width: isVertical ? 26 : 32, height: isVertical ? 26 : 32, flex: '0 0 auto', borderRadius: 9, background: biome.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <img src={biome.icon} alt=""
            style={{height: isVertical ? 16 : 20, filter: biome.iconInvert ? 'brightness(0) invert(1)' : 'none'}}/>
        </div>
        <div style={{minWidth: 0}}>
          <div style={{fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
            color: 'var(--text-muted)', textTransform: 'uppercase', lineHeight: 1.2,
            whiteSpace: 'nowrap'}}>
            Path {biome.n} · {biome.tier}
          </div>
          <div style={{fontSize: isVertical ? 12 : 14, fontWeight: 700, fontFamily: 'var(--font-heading)',
            color: 'var(--text-primary)', lineHeight: 1.1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{biome.name}</div>
        </div>
      </div>

      {/* Progress chip */}
      <div style={{position: 'absolute', top: 18, right: 12, display: 'inline-flex',
        alignItems: 'center', gap: 6, background: 'rgba(17,24,39,.85)', color: '#fff',
        padding: isVertical ? '4px 9px' : '6px 12px', borderRadius: 9999,
        fontSize: isVertical ? 11 : 12, fontWeight: 600, zIndex: 4,
        whiteSpace: 'nowrap'}}>
        {biome.main.filter(l => l.state === 'done').length} / {biome.main.length}
      </div>

      {/* Path SVG (full path + completed segment) */}
      <svg width="100%" height={height}
        style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}
        preserveAspectRatio="none">
        {/* dashed total path */}
        <path d={pathD} stroke={biome.trail} strokeWidth="6"
          strokeLinecap="round" strokeDasharray="2 12" fill="none" opacity="0.5"/>
        {/* solid colored "done" overlay using strokeDasharray trick */}
        <path d={pathD} stroke={biome.trail} strokeWidth="7"
          strokeLinecap="round" fill="none" opacity="0.85"
          pathLength="1"
          strokeDasharray={`${progressT} 1`} />
      </svg>

      {/* Lesson nodes — absolutely positioned at their x,y */}
      {mainNodes.map(node => (
        <div key={`m-${node.n}`} style={{
          position: 'absolute',
          left: node.x, top: node.y,
          transform: 'translate(-50%, -50%)',
          zIndex: node.state === 'active' ? 8 : 6,
        }}>
          <LessonNode lesson={node} onClick={onLesson}
            hovered={hovered} setHovered={setHovered}/>
        </div>
      ))}

      {/* Bonus badges */}
      {bonusNodes.map(node => (
        <div key={`b-${node.n}`} style={{
          position: 'absolute', left: node.x, top: node.y,
          transform: 'translate(-50%, -50%)', zIndex: 7,
        }}>
          <BonusBadge lesson={node} onClick={onLesson}
            hovered={hovered} setHovered={setHovered} neon={biome.neon}/>
        </div>
      ))}

      {/* Hover preview */}
      {hovered && (() => {
        const all = [...mainNodes, ...bonusNodes];
        const node = all.find(n => n.n === hovered.n);
        if (!node) return null;
        let side;
        if (isVertical) {
          // popup goes left or right, away from the wall it's near
          side = node.x > centerX ? 'left' : 'right';
        } else {
          side = node.y > centerY ? 'top' : 'bottom';
        }
        return <HoverCard lesson={hovered} x={node.x} y={node.y}
          biomeName={biome.name} side={side} containerW={width}/>;
      })()}
    </section>
  );
}

// ─── Top-level VibeMap ───────────────────────────────────────────────
function VibeMap({tweaks, onLesson}) {
  return (
    <main style={{padding: '24px 0', background: 'var(--background)'}}>
      <style>{`
        @keyframes mapPulse {
          0%   { transform: scale(1);   opacity: .8; }
          100% { transform: scale(1.7); opacity:  0; }
        }
        @keyframes bonusRadar {
          0%   { transform: scale(1);   opacity: .85; }
          100% { transform: scale(2.0); opacity:  0; }
        }
        @keyframes robotBob {
          0%, 100% { transform: translateY(0)    rotate(-1.5deg); }
          50%      { transform: translateY(-4px) rotate( 1.5deg); }
        }
        @keyframes hoverFade {
          from { opacity: 0; transform: translate(-50%, calc(var(--ty, -100%) - 6px)); }
          to   { opacity: 1; }
        }
        .vibe-map-shell {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 18px;
        }
        .vibe-map-shell .stitched {
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--border, rgba(17,24,39,.08));
          box-shadow: 0 18px 38px rgba(17,24,39,.10), 0 4px 10px rgba(17,24,39,.06);
        }
        @media (max-width: 640px) {
          .vibe-map-shell { padding: 0 10px; }
          .vibe-map-shell .stitched { border-radius: 14px; }
          .vibe-map-header { flex-direction: column; align-items: flex-start !important; gap: 12px; }
          .vibe-map-header .progress-card { width: 100%; }
        }
      `}</style>

      {/* Header */}
      <div className="vibe-map-shell">
        <div className="vibe-map-header" style={{display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 18, gap: 12}}>
          <div>
            <div className="eyebrow" style={{marginBottom: 6}}>YOUR JOURNEY</div>
            <h2 style={{margin: 0, fontSize: 'clamp(22px, 4vw, 28px)'}}>The path of vibe coding</h2>
            <p style={{margin: '6px 0 0', fontSize: 14, color: 'var(--text-secondary)'}}>
              5 biomes · 30 lessons · about a month at five minutes a day
            </p>
          </div>
          <div className="progress-card"
            style={{display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--surface)', border: '1px solid var(--border)',
              padding: '10px 14px', borderRadius: 14,
              boxShadow: '0 4px 12px rgba(17,24,39,.06)'}}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <div style={{fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                color: 'var(--text-muted)', textTransform: 'uppercase'}}>OVERALL</div>
              <div style={{fontSize: 13, fontWeight: 600, color: 'var(--text-primary)'}}>9 of 30 lessons</div>
            </div>
            <div style={{flex: 1, minWidth: 80, height: 8, background: 'var(--surface-muted)',
              borderRadius: 9999, overflow: 'hidden'}}>
              <div style={{width: '30%', height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--primary-hover))'}}/>
            </div>
            <div style={{display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'var(--text-primary)', color: '#fff',
              padding: '5px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 700}}>
              <span style={{color: 'var(--xp-gold)'}}>⚡</span> 1,840
            </div>
          </div>
        </div>

        {/* Stitched biomes */}
        <div className="stitched">
          {BIOMES.map(b => <BiomeBand key={b.n} biome={b} onLesson={onLesson}/>)}
        </div>

        <div style={{marginTop: 14, display: 'flex', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'var(--text-muted)'}}>
          <span>Free paths · Pro paths · Hex-badge bonus side-quests</span>
          <span>Tip: hover or tap any node to preview the lesson.</span>
        </div>
      </div>
    </main>
  );
}

window.VibeMap = VibeMap;
