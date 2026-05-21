import type { ReactNode } from "react";

export function ParentSection({
  title,
  caption,
  className,
  children,
}: {
  title: string;
  caption?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={className ? `parent-section ${className}` : "parent-section"}>
      <div className="section-heading">
        <h2>{title}</h2>
        {caption && <p>{caption}</p>}
      </div>
      {children}
    </section>
  );
}
