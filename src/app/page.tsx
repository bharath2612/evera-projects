import { fetchProjects, fetchUnits, statsByProject } from "@/lib/data";
import { MapExplorer } from "@/components/map-explorer";

export const revalidate = 60;

export default async function HomePage() {
  const [projects, units] = await Promise.all([fetchProjects(), fetchUnits()]);
  const stats = statsByProject(units);

  return (
    <MapExplorer
      projects={projects}
      stats={Object.fromEntries(stats)}
    />
  );
}
