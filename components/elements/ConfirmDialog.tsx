import React from 'react';

interface Props {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<Props> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="mchub-modal-back" onClick={onCancel}>
      <div className="mchub-modal" onClick={(e) => e.stopPropagation()}>
        <h4>{title}</h4>
        <p>{message}</p>
        <div className="mchub-modal-actions">
          <button className="mchub-btn ghost" onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button
            className={`mchub-btn ${danger ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
