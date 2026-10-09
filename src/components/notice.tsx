import type { ReactNode } from 'react';

type Tone = 'warn' | 'danger';

export function Notice({ tone, children, action }: { tone: Tone; children: ReactNode; action?: ReactNode }) {
  return (
    <div className={`notice notice-${tone}`}>
      <p className="notice-text">{children}</p>
      {action}
    </div>
  );
}
