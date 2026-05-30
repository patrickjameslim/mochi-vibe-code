import { useState } from 'react';
import { CheckCircle, X } from '@phosphor-icons/react';

interface SuccessBannerProps {
  message: string;
  onDismiss: () => void;
}

export function SuccessBanner({ message, onDismiss }: SuccessBannerProps) {
  const [leaving, setLeaving] = useState(false);

  function handleDismiss() {
    setLeaving(true);
    setTimeout(onDismiss, 180);
  }

  return (
    <div
      className={`flex items-center gap-3 bg-green-50 border-b border-green-200 px-6 py-3 w-full overflow-hidden ${
        leaving ? 'banner-leave' : 'banner-enter'
      }`}
    >
      <CheckCircle size={18} weight="fill" className="shrink-0 text-green-600" />
      <p className="flex-1 text-sm text-green-800">{message}</p>
      <button
        onClick={handleDismiss}
        className="inline-flex items-center justify-center w-7 h-7 rounded border border-green-200 text-green-600 hover:bg-green-100 transition-colors shrink-0"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );
}
