function TopBar({title, subtitle}) {
  return (
    <header style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)'}}>
      <div>
        <div style={{fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 4}}>{subtitle}</div>
        <h3 style={{margin: 0, fontSize: 20, fontWeight: 600}}>{title}</h3>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 9999, fontSize: 13, fontWeight: 600}}>
          <span style={{color: 'var(--streak-fire)'}}>🔥</span> 12
        </div>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 9999, fontSize: 13, fontWeight: 600}}>
          <span style={{color: 'var(--streak-freeze)'}}>❄</span> 2
        </div>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--text-primary)', color: '#fff', padding: '6px 12px', borderRadius: 9999, fontSize: 13, fontWeight: 700}}>
          <span style={{color: 'var(--xp-gold)'}}>⚡</span> 1,840 XP
        </div>
        <div style={{width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'var(--font-heading)'}}>S</div>
      </div>
    </header>
  );
}
window.TopBar = TopBar;
