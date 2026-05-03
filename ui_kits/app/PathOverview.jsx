function PathOverview({onLesson}) {
  const lessons = [
    {n: 1, title: 'What is a prompt, really?', mins: 6, state: 'done'},
    {n: 2, title: 'Specificity beats cleverness.', mins: 7, state: 'done'},
    {n: 3, title: 'Context is half the answer.', mins: 8, state: 'done'},
    {n: 4, title: 'Anatomy of a good prompt.', mins: 9, state: 'active'},
    {n: 5, title: 'Iterating without starting over.', mins: 7, state: 'next'},
    {n: 6, title: 'When AI gets it wrong.', mins: 8, state: 'locked'},
    {n: 7, title: 'Roles, examples, and constraints.', mins: 10, state: 'locked'},
    {n: 8, title: 'Putting it together.', mins: 12, state: 'locked'},
  ];
  return (
    <main style={{padding: 32}}>
      <div style={{maxWidth: 720, margin: '0 auto'}}>
        <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 28px 22px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 22, boxShadow: 'var(--shadow-sm)'}}>
          <div style={{width: 64, height: 64, background: 'var(--primary-light)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <img src="../../assets/icon-path-prompt.svg" style={{height: 38}}/>
          </div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--primary-deep)', marginBottom: 4}}>PATH 2 · 🟢 BEGINNER</div>
            <h3 style={{margin: 0, marginBottom: 4, fontSize: 22}}>The Prompt</h3>
            <div style={{fontSize: 13.5, color: 'var(--text-secondary)'}}>3 of 8 lessons done · ~5 hours total</div>
          </div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          {lessons.map(l => {
            const isActive = l.state === 'active';
            const isLocked = l.state === 'locked';
            const isDone = l.state === 'done';
            return (
              <button key={l.n} onClick={() => !isLocked && onLesson()} disabled={isLocked} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 18px', textAlign: 'left',
                background: isActive ? 'var(--primary-light)' : 'var(--surface)',
                border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 14, cursor: isLocked ? 'default' : 'pointer',
                opacity: isLocked ? 0.5 : 1, fontFamily: 'var(--font-body)',
                boxShadow: isActive ? 'var(--shadow-md)' : 'none',
              }}>
                <div style={{width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--surface-muted)',
                  color: (isDone || isActive) ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: 13}}>
                  {isDone ? '✓' : isLocked ? '🔒' : l.n}
                </div>
                <div style={{flex: 1}}>
                  <div style={{fontSize: 15, fontWeight: 600, color: 'var(--text-primary)'}}>{l.title}</div>
                  <div style={{fontSize: 12, color: 'var(--text-muted)', marginTop: 2}}>Lesson {String(l.n).padStart(2, '0')} · ~{l.mins} min</div>
                </div>
                {isActive && <span style={{color: 'var(--primary-deep)', fontWeight: 600, fontSize: 13}}>Resume →</span>}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
window.PathOverview = PathOverview;
