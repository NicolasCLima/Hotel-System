import React, { useEffect } from 'react';
import './Modal.css';

export default function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box animate-fade"
        style={{ maxWidth: width }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="gold-line" style={{ margin: '0' }} />
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
