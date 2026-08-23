import type { ReactNode } from "react";
import { accentStyle, fetchProjects } from "@/lib/data";

export const revalidate = 60;

/**
 * Per-project accent: overrides the site-wide --brand for everything in
 * this segment (project page, inventory, unit pages). display:contents so
 * the wrapper never affects layout; body-portaled overlays (the floor
 * sheet) escape this subtree and get the var directly on their portal root.
 */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = (await fetchProjects()).find((p) => p.slug === slug);
  const style = project ? accentStyle(project) : undefined;
  if (!style) return <>{children}</>;
  return (
    <div className="contents" style={style}>
      {children}
    </div>
  );
}
