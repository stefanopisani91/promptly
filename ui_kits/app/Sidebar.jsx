function Sidebar({active, onNav}) {
  const items = [
    {id: 'dashboard', label: 'Dashboard', icon: '◉'},
    {id: 'path', label: 'Curriculum', icon: '☰'},
    {id: 'practice', label: 'Practice', icon: '✎'},
    {id: 'progress', label: 'Progress', icon: '⏶'},
    {id: 'settings', label: 'Settings', icon: '⚙'},
  ];
  return (
    <aside className="promptly-sidebar" style={{width: 232, background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 4, height: '100vh', position: 'sticky', top: 0}}>
      <div style={{padding: '6px 10px 18px'}}>
        <img src="../../assets/logo-horizontal.svg" alt="Promptly" style={{height: 26}}/>
      </div>
      {items.map(it => (
        <button key={it.id} onClick={() => onNav(it.id)} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px', borderRadius: 10,
          background: active === it.id ? 'var(--primary-light)' : 'transparent',
          color: active === it.id ? 'var(--primary-deep)' : 'var(--text-secondary)',
          fontWeight: active === it.id ? 600 : 500,
          border: 0, cursor: 'pointer', fontSize: 14,
          fontFamily: 'var(--font-body)', textAlign: 'left',
        }}>
          <span style={{fontSize: 16, opacity: 0.9}}>{it.icon}</span>
          {it.label}
        </button>
      ))}
      <div style={{marginTop: 'auto', padding: 12, background: 'var(--surface-muted)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10}}>
        <div style={{width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'var(--font-heading)'}}>S</div>
        <div style={{minWidth: 0}}>
          <div style={{fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>Stefano</div>
          <div style={{fontSize: 11, color: 'var(--pro-accent)', fontWeight: 700, letterSpacing: '0.06em'}}>PRO</div>
        </div>
      </div>
    </aside>
  );
}
window.Sidebar = Sidebar;
