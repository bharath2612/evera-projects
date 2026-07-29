import {
  fetchProjectMedia,
  fetchProjects,
  fetchUnits,
  publicMediaUrl,
  statsByProject,
} from "@/lib/data";
import { MapExplorer } from "@/components/map-explorer";

export const revalidate = 60;

export default async function HomePage() {
  const [projects, units, media] = await Promise.all([
    fetchProjects(),
    fetchUnits(),
    fetchProjectMedia(),
  ]);
  const stats = statsByProject(units);
  const covers: Record<string, string> = {};
  for (const item of media) {
    if (!(item.project_id in covers)) covers[item.project_id] = publicMediaUrl(item.path);
  }

  return (
    <MapExplorer
      projects={projects}
      stats={Object.fromEntries(stats)}
      covers={covers}
    />
  );
}
