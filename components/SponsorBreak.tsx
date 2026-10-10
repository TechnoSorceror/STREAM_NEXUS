import React, { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import Advertisement from './Advertisement';

const BREAK_INTERVAL_MS = 30 * 60 * 1000;
const BREAK_DURATION_SECONDS = 10;
const MAX_BREAKS_PER_SESSION = 4;
const COUNT_KEY = 'streamnexus_sponsor_break_count';
const NEXT_BREAK_KEY = 'streamnexus_sponsor_break_next_at_v2';

const readSessionNumber = (key: string) => {
  if (typeof window === 'undefined') return 0;
  try {
    const value = Number(window.sessionStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
};

const writeSessionNumber = (key: string, value: number) => {
  try {
    window.sessionStorage.setItem(key, String(value));
  } catch {
    // Session storage can be unavailable in hardened browser modes.
  }
};

const removeSessionValue = (key: string) => {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Session storage can be unavailable in hardened browser modes.
  }
};

const SponsorBreak: React.FC = () => {
  const initialCount = Math.min(readSessionNumber(COUNT_KEY), MAX_BREAKS_PER_SESSION);
  const [breakCount, setBreakCount] = useState(initialCount);
  const [nextBreakAt, setNextBreakAt] = useState<number | null>(() => {
    if (initialCount >= MAX_BREAKS_PER_SESSION) return null;
    return Math.min(readSessionNumber(NEXT_BREAK_KEY) || Infinity, Date.now() + BREAK_INTERVAL_MS);
  });
  const [open, setOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(BREAK_DURATION_SECONDS);
  const dialogRef = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (breakCount >= MAX_BREAKS_PER_SESSION || open || !nextBreakAt) return;
    writeSessionNumber(NEXT_BREAK_KEY, nextBreakAt);
    const timeout = window.setTimeout(() => {
      const nextCount = Math.min(breakCount + 1, MAX_BREAKS_PER_SESSION);
      writeSessionNumber(COUNT_KEY, nextCount);
      removeSessionValue(NEXT_BREAK_KEY);
      setBreakCount(nextCount);
      setNextBreakAt(null);
      setSecondsRemaining(BREAK_DURATION_SECONDS);
      setOpen(true);
    }, Math.max(0, nextBreakAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [breakCount, nextBreakAt, open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setSecondsRemaining(value => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (open && secondsRemaining === 0) continueRef.current?.focus();
  }, [open, secondsRemaining]);

  const closeBreak = () => {
    if (secondsRemaining > 0) return;
    setOpen(false);
    if (breakCount < MAX_BREAKS_PER_SESSION) {
      const next = Date.now() + BREAK_INTERVAL_MS;
      writeSessionNumber(NEXT_BREAK_KEY, next);
      setNextBreakAt(next);
    }
  };

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], iframe, [tabindex="0"]') || [])];
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  return (
    <div className="sponsor-break" role="presentation">
      <div
        className="sponsor-break__panel"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sponsor-break-title"
        aria-describedby="sponsor-break-description"
        tabIndex={-1}
        onKeyDown={trapFocus}
      >
        <header className="sponsor-break__header">
          <span className="sponsor-break__icon" aria-hidden="true"><Heart size={22} fill="currentColor" /></span>
          <div>
            <span className="sponsor-break__count">Sponsor break {breakCount} of {MAX_BREAKS_PER_SESSION}</span>
            <h2 id="sponsor-break-title">Thanks for supporting StreamNexus</h2>
            <p id="sponsor-break-description">This short sponsor break helps keep StreamNexus available. Interacting with the advertisement is always optional.</p>
          </div>
        </header>

        <div className="sponsor-break__ad"><Advertisement format="rectangle" className="sn-ad-slot--break" /></div>

        <footer className="sponsor-break__footer">
          {secondsRemaining > 0 ? (
            <p aria-live="polite">Continue available in <strong>{secondsRemaining}s</strong>. The timer pauses when this tab is not visible.</p>
          ) : (
            <p aria-live="polite"><strong>Thank you.</strong> You can continue enjoying StreamNexus.</p>
          )}
          <button
            className="button button-primary"
            type="button"
            ref={continueRef}
            disabled={secondsRemaining > 0}
            onClick={closeBreak}
          >
            {secondsRemaining > 0 ? `Please wait ${secondsRemaining}s` : 'Continue watching'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SponsorBreak;
