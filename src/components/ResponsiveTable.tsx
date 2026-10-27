import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** Keep the desktop table; expose every column as a labelled field on phones. */
export function ResponsiveTable({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    root.current?.querySelectorAll('table').forEach((table) => {
      const labels = Array.from(table.querySelectorAll('thead th')).map((header) => header.textContent?.trim() ?? '');
      table.querySelectorAll('tbody tr').forEach((row) => {
        Array.from(row.children).forEach((cell, index) => { (cell as HTMLElement).dataset.columnLabel = labels[index] ?? ''; });
      });
    });
  }, [children]);
  return <div ref={root} className="responsive-admin-table overflow-x-auto">{children}</div>;
}
