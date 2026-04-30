import { ReactNode } from "react";

export default function EducatorsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-0 py-12">
      <div className="max-w-6xl mx-auto">{children}</div>
    </div>
  );
}
