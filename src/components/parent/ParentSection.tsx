import type { ReactNode } from "react";

export function ParentSection({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <section className="parent-section">
      <div className="section-heading">
        <h2>{title}</h2>
        {caption && <p>{caption}</p>}
      </div>
      {children}
    </section>
  );
}
