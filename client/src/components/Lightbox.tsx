import React from 'react';

interface LightboxProps {
  url: string;
  onClose: () => void;
}

export function Lightbox({ url, onClose }: LightboxProps) {
  const [scale, setScale] = React.useState(1);
  const [tx, setTx] = React.useState(0);
  const [ty, setTy] = React.useState(0);
  const isDragging = React.useRef(false);
  const dragStart = React.useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const lastPinchDist = React.useRef(0);
  const vpRef = React.useRef<HTMLDivElement>(null);

  const VW = Math.min(window.innerWidth - 32, 480);
  const VH = Math.min(window.innerHeight - 160, 360);

  function clamp(s: number, x: number, y: number) {
    const maxX = Math.max(0, (VW * s - VW) / 2);
    const maxY = Math.max(0, (VH * s - VH) / 2);
    return [Math.min(maxX, Math.max(-maxX, x)), Math.min(maxY, Math.max(-maxY, y))];
  }

  function zoomStep(delta: number) {
    setScale(prev => {
      const next = Math.min(4, Math.max(0.5, prev + delta));
      const [cx, cy] = clamp(next, tx, ty);
      setTx(cx); setTy(cy);
      return next;
    });
  }

  function reset() { setScale(1); setTx(0); setTy(0); }

  React.useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomStep(e.deltaY > 0 ? -0.15 : 0.15);
    };
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY, tx, ty };
      vp.style.cursor = 'grabbing';
      e.preventDefault();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const [cx, cy] = clamp(scale, dragStart.current.tx + e.clientX - dragStart.current.x, dragStart.current.ty + e.clientY - dragStart.current.y);
      setTx(cx); setTy(cy);
    };
    const onMouseUp = () => { isDragging.current = false; vp.style.cursor = scale > 1 ? 'grab' : 'default'; };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastPinchDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      } else if (e.touches.length === 1 && scale > 1) {
        isDragging.current = true;
        dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
      }
      e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        setScale(prev => { const next = Math.min(4, Math.max(0.5, prev * (dist / lastPinchDist.current))); const [cx, cy] = clamp(next, tx, ty); setTx(cx); setTy(cy); lastPinchDist.current = dist; return next; });
      } else if (e.touches.length === 1 && isDragging.current) {
        const [cx, cy] = clamp(scale, dragStart.current.tx + e.touches[0].clientX - dragStart.current.x, dragStart.current.ty + e.touches[0].clientY - dragStart.current.y);
        setTx(cx); setTy(cy);
      }
      e.preventDefault();
    };
    const onTouchEnd = () => { isDragging.current = false; };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    vp.addEventListener('wheel', onWheel, { passive: false });
    vp.addEventListener('mousedown', onMouseDown);
    vp.addEventListener('touchstart', onTouchStart, { passive: false });
    vp.addEventListener('touchmove', onTouchMove, { passive: false });
    vp.addEventListener('touchend', onTouchEnd);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKey);
    return () => {
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('mousedown', onMouseDown);
      vp.removeEventListener('touchstart', onTouchStart);
      vp.removeEventListener('touchmove', onTouchMove);
      vp.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKey);
    };
  }, [scale, tx, ty]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
        <div ref={vpRef} style={{ width: VW, height: VH, overflow: 'hidden', borderRadius: 12, border: '0.5px solid #e2e8f0', background: '#fff', position: 'relative', touchAction: 'none', cursor: scale > 1 ? 'grab' : 'default' }}>
          <img src={url} alt="foto produksi" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', transformOrigin: 'center center', transform: `translate(${tx}px,${ty}px) scale(${scale})`, userSelect: 'none', pointerEvents: 'none' }} draggable={false} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 99, padding: '6px 14px' }}>
          <button onClick={() => zoomStep(-0.25)} style={{ width:32, height:32, borderRadius:'50%', border:'0.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <span style={{ fontSize:13, color:'#64748b', minWidth:40, textAlign:'center' }}>{Math.round(scale*100)}%</span>
          <button onClick={() => zoomStep(0.25)} style={{ width:32, height:32, borderRadius:'50%', border:'0.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button onClick={reset} style={{ width:32, height:32, borderRadius:'50%', border:'0.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
          <div style={{ width:'0.5px', height:20, background:'#e2e8f0', margin:'0 4px' }}/>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'0.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>Klik di luar untuk tutup · Scroll/pinch untuk zoom · Drag untuk geser</p>
      </div>
    </div>
  );
}

export default Lightbox;
