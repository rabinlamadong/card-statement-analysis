import { Dashboard } from "@/components/dashboard";
import { loadDashboardData } from "@/lib/load-statements";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await loadDashboardData();
  return <Dashboard data={data} />;
}
