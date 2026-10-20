import { useEffect } from 'react';
import { loadScriptWithTimeout } from '../lib/ad-loader.js';
import { AD_SCRIPT_URL } from '../config.js';

// Loads the ad network script once for the whole app, however many slots exist.
let adScriptRequested = false;

// Ad placeholders. variant "rail" = tall side column (wide screens only).
// variant "banner" = one centred rectangle: 300x250 on phones, 728x90 on tablet and up.
// Each slot has a stable id so the ad network can fill it.
export default function AdSlot({ variant, placement, className = '' }) {
  useEffect(() => {
    if (!AD_SCRIPT_URL || adScriptRequested) return;
    adScriptRequested = true;
    loadScriptWithTimeout(AD_SCRIPT_URL);
  }, []);

  const size =
    variant === 'rail'
      ? 'h-[600px] w-[160px] sticky top-24 self-start'
      : 'mx-auto h-[250px] w-[300px] md:h-[90px] md:w-[728px]';

  return (
    <aside aria-label="Advertisement" className={`flex flex-col gap-2 ${size} ${className}`}>
      <p className="eyebrow text-center">Advertisement</p>
      <div
        id={`ad-${placement}`}
        className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-line bg-surface text-center text-xs leading-4 text-muted"
      >
        {variant === 'rail' ? '160 × 600' : 'Banner ad'}
      </div>
    </aside>
  );
}
