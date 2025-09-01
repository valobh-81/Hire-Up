import type { ReactNode } from 'react';

export default function StudentLayout({ children }: { children: ReactNode }) {
  // The student theme is the default theme in globals.css,
  // so no specific class is needed, but this structure allows for future overrides.
  return <div className="h-full">{children}</div>;
}
