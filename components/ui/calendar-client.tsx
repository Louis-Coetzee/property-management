'use client';

import * as React from 'react';
import { Calendar as CalendarBase } from './calendar';
import type { CalendarProps } from './calendar';

export function Calendar(props: CalendarProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-3">Loading calendar...</div>;
  }

  return <CalendarBase {...props} />;
}
