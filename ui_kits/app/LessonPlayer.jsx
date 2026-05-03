function LessonPlayer({onComplete}) {
  const [v1, setV1] = React.useState('');
  const [v2, setV2] = React.useState('');
  const [v3, setV3] = React.useState('');
  const [checked, setChecked] = React.useState(false);
  const [hint, setHint] = React.useState(false);
  const ok1 = v1.toLowerCase().trim() === 'role';
  const ok2 = v2.toLowerCase().trim() === 'task';
  const ok3 = v3.toLowerCase().trim() === 'format';
  const allOk = ok1 && ok2 && ok3;
  return (
    <main style={{padding: 32, maxWidth: 880, margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20}}>
        <button style={{background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14}}>← Path 2</button>
        <div style={{flex: 1, height: 6, background: 'var(--surface-muted)', borderRadius: 9999, overflow: 'hidden'}}>
          <div style={{width: '60%', height: '100%', background: 'var(--primary)', borderRadius: 9999, transition: 'width .3s'}}></div>
        </div>
        <div style={{fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)'}}>3 / 5</div>
      </div>

      <div style={{fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--primary-deep)', marginBottom: 10}}>LESSON 04 · ANATOMY OF A PROMPT</div>
      <h2 style={{margin: 0, marginBottom: 12}}>The three pieces every good prompt has.</h2>
      <p style={{margin: 0, marginBottom: 28, fontSize: 17}}>Drag the labels onto the right slots — or just type them in. We'll check together.</p>

      <div style={{background: '#1E293B', borderRadius: 18, padding: '26px 30px', marginBottom: 18, boxShadow: 'var(--shadow-lg)'}}>
        <div style={{fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(226,232,240,0.6)', fontFamily: 'var(--font-body)', marginBottom: 14}}>PROMPT</div>
        <div style={{fontFamily: 'var(--font-mono)', fontSize: 15, lineHeight: 2, color: '#E2E8F0'}}>
          <span style={{color: 'rgba(226,232,240,.5)'}}>// 1. </span>You're a <input value={v1} onChange={e => setV1(e.target.value)} placeholder="?" style={{background: 'transparent', border: 0, borderBottom: `2px solid ${checked && ok1 ? '#86EFAC' : '#F59E0B'}`, color: checked && ok1 ? '#86EFAC' : '#F59E0B', font: 'inherit', fontWeight: 600, padding: '0 6px', width: 110, outline: 'none'}}/>.<br/>
          <span style={{color: 'rgba(226,232,240,.5)'}}>// 2. </span>Your <input value={v2} onChange={e => setV2(e.target.value)} placeholder="?" style={{background: 'transparent', border: 0, borderBottom: `2px solid ${checked && ok2 ? '#86EFAC' : '#F59E0B'}`, color: checked && ok2 ? '#86EFAC' : '#F59E0B', font: 'inherit', fontWeight: 600, padding: '0 6px', width: 90, outline: 'none'}}/> is to write a 60-word product description.<br/>
          <span style={{color: 'rgba(226,232,240,.5)'}}>// 3. </span>Output <input value={v3} onChange={e => setV3(e.target.value)} placeholder="?" style={{background: 'transparent', border: 0, borderBottom: `2px solid ${checked && ok3 ? '#86EFAC' : '#F59E0B'}`, color: checked && ok3 ? '#86EFAC' : '#F59E0B', font: 'inherit', fontWeight: 600, padding: '0 6px', width: 110, outline: 'none'}}/>: a single paragraph, no bullet points.
        </div>
      </div>

      {hint && <div style={{background: 'var(--warning-light)', color: '#92400E', padding: '12px 16px', borderRadius: 12, fontSize: 14, marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start'}}><span>💡</span><span><b>Hint:</b> The three R-T-F slots — who, what, how — in that order.</span></div>}

      <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
        <button onClick={() => setChecked(true)} style={{background: 'var(--primary)', color: '#fff', border: 0, borderRadius: 8, padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer'}}>Check answer</button>
        <button onClick={() => setHint(true)} style={{background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 18px', fontWeight: 500, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6}}>💡 Show hint</button>
        {checked && allOk && (
          <span style={{marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8}}>
            <span style={{color: 'var(--success)', fontSize: 14, fontWeight: 600}}>✓ Correct! +50 XP</span>
            <button onClick={onComplete} style={{background: 'var(--success)', color: '#fff', border: 0, borderRadius: 8, padding: '12px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer'}}>Continue →</button>
          </span>
        )}
        {checked && !allOk && <span style={{marginLeft: 'auto', color: 'var(--error)', fontSize: 14, fontWeight: 500}}>Not quite — try again.</span>}
      </div>
    </main>
  );
}
window.LessonPlayer = LessonPlayer;
