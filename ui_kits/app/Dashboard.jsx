function GoalRing({value, total}) {
  const pct = value / total;
  const C = 2 * Math.PI * 38;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="38" fill="none" stroke="var(--surface-muted)" strokeWidth="9"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="var(--primary)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 50 50)"/>
      <text x="50" y="52" textAnchor="middle" fontSize="22" fontWeight="700" fontFamily="var(--font-heading)" fill="var(--text-primary)">{value}</text>
      <text x="50" y="68" textAnchor="middle" fontSize="9" letterSpacing="1.5" fontFamily="var(--font-body)" fontWeight="600" fill="var(--text-muted)">OF {total} MIN</text>
    </svg>
  );
}

function Dashboard({onContinue, onPath}) {
  const paths = [
    {n:1, name:'The Mindset', icon:'../../assets/icon-path-mindset.svg', done:6, total:6, state:'done'},
    {n:2, name:'The Prompt', icon:'../../assets/icon-path-prompt.svg', done:3, total:8, state:'active'},
    {n:3, name:'Build', icon:'../../assets/icon-path-build.svg', done:0, total:10, state:'locked'},
    {n:4, name:'Debug', icon:'../../assets/icon-path-debug.svg', done:0, total:8, state:'locked'},
    {n:5, name:'Ship', icon:'../../assets/icon-path-ship.svg', done:0, total:6, state:'locked'},
  ];
  return (
    <main style={{padding: 32, display: 'flex', flexDirection: 'column', gap: 24}}>
      <div style={{display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20}}>
        <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-sm)'}}>
          <div style={{fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--primary-deep)', marginBottom: 8}}>CONTINUE</div>
          <h3 style={{margin: 0, marginBottom: 6, fontSize: 24}}>Lesson 04 · Anatomy of a good prompt</h3>
          <p style={{margin: 0, marginBottom: 18, fontSize: 14.5}}>Path 2 · The Prompt &nbsp;·&nbsp; ~6 minutes left</p>
          <div style={{height: 8, background: 'var(--surface-muted)', borderRadius: 9999, marginBottom: 18, overflow: 'hidden'}}>
            <div style={{width: '38%', height: '100%', background: 'var(--primary)', borderRadius: 9999}}></div>
          </div>
          <button onClick={onContinue} style={{background: 'var(--primary)', color: '#fff', border: 0, borderRadius: 8, padding: '12px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer'}}>Resume lesson →</button>
        </div>
        <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 22}}>
          <GoalRing value={7} total={10}/>
          <div>
            <div style={{fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 4}}>DAILY GOAL</div>
            <div style={{fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)'}}>3 minutes to go</div>
            <div style={{display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, background: 'var(--surface-muted)', padding: '5px 11px', borderRadius: 9999, fontSize: 12, fontWeight: 600}}>
              <span style={{color: 'var(--streak-fire)'}}>🔥</span> 12-day streak
            </div>
          </div>
        </div>
      </div>
      <div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14}}>
          <h4 style={{margin: 0, fontSize: 18, fontWeight: 600}}>Your paths</h4>
          <a href="#" style={{fontSize: 13, color: 'var(--primary-deep)', textDecoration: 'none', fontWeight: 600}}>See all 38 lessons →</a>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14}}>
          {paths.map(p => {
            const pct = p.done / p.total;
            return (
              <article key={p.n} onClick={() => p.state !== 'locked' && onPath()} style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 18, cursor: p.state === 'locked' ? 'default' : 'pointer', opacity: p.state === 'locked' ? 0.55 : 1, boxShadow: 'var(--shadow-sm)', transition: 'all .2s'}}
                onMouseEnter={e => p.state !== 'locked' && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = 'var(--shadow-lg)')}
                onMouseLeave={e => (e.currentTarget.style.transform = '', e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16}}>
                  <div style={{width: 44, height: 44, background: 'var(--primary-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><img src={p.icon} style={{height: 26}}/></div>
                  {p.state === 'done' && <span style={{color: 'var(--success)', fontSize: 18}}>✓</span>}
                  {p.state === 'active' && <span style={{background: 'var(--primary)', width: 10, height: 10, borderRadius: '50%', boxShadow: '0 0 0 4px rgba(232,112,63,.18)'}}></span>}
                  {p.state === 'locked' && <span style={{color: 'var(--text-muted)', fontSize: 16}}>🔒</span>}
                </div>
                <div style={{fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)'}}>Path {p.n}</div>
                <div style={{fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)', marginTop: 3, marginBottom: 12}}>{p.name}</div>
                <div style={{height: 5, background: 'var(--surface-muted)', borderRadius: 9999, overflow: 'hidden'}}>
                  <div style={{width: `${pct*100}%`, height: '100%', background: p.state === 'done' ? 'var(--success)' : 'var(--primary)'}}></div>
                </div>
                <div style={{fontSize: 11, color: 'var(--text-muted)', marginTop: 6}}>{p.done} / {p.total}</div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
window.Dashboard = Dashboard;
