'use client';
import { useState, type ReactNode } from 'react';

/** Styled replacement for window.confirm: renders a trigger, then an in-page dialog. */
export default function ConfirmButton({ message, confirmLabel = 'Confirm', danger, onConfirm, className, style, disabled, children }: { message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; className?: string; style?: React.CSSProperties; disabled?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} style={style} disabled={disabled} onClick={() => setOpen(true)}>{children}</button>
      {open && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(28,27,25,.45)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 60, textAlign: 'left' }} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="col gap16" style={{ background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--ink)', maxWidth: 440, width: '100%', padding: 26 }}>
            <span style={{ fontSize: 15.5, lineHeight: 1.55 }}>{message}</span>
            <div className="row gap10">
              <button type="button" className={'btn ' + (danger ? 'btn-danger' : 'btn-green')} onClick={() => { setOpen(false); onConfirm(); }}>{confirmLabel}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
