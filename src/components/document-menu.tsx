'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function DocumentMenu({ children }: { children: ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (menu.current?.open && event.target instanceof Node && !menu.current.contains(event.target)) menu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menu.current?.open) {
        menu.current.open = false;
        trigger.current?.focus();
        event.preventDefault();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);
  return (
    <details className="document-menu" ref={menu} onToggle={(event) => {
      if (!event.currentTarget.open) return;
      for (const sibling of event.currentTarget.parentElement?.querySelectorAll('details[open]') ?? []) {
        if (sibling !== event.currentTarget && !event.currentTarget.contains(sibling)) sibling.removeAttribute('open');
      }
    }}>
      <summary ref={trigger} aria-label="Browse and download all documents" title="Browse and download all documents">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M9 13h6M9 17h6" />
        </svg>
        <span>Documents</span>
      </summary>
      <nav className="document-menu-popup source-documents" aria-label="Source document downloads">{children}</nav>
    </details>
  );
}
