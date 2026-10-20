import { X } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

// A one-off message from the server (for example, "your deletion was cancelled").
export default function NoticeBar() {
  const { notice, clearNotice } = useAuth();
  if (!notice) return null;
  return (
    <div role="status" className="border-b border-cyan/30 bg-cyan/10">
      <div className="page flex items-center justify-between gap-4 py-3">
        <p className="text-sm leading-5 text-cyan">{notice}</p>
        <button
          type="button"
          onClick={clearNotice}
          aria-label="Dismiss"
          className="grid size-8 shrink-0 place-items-center rounded-md text-cyan hover:bg-cyan/10"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
