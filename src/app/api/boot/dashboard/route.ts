import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api-guard";
import { isStaff } from "@/lib/permissions";
import type { AuthUser } from "@/lib/auth";
import {
  getDashboardExtras,
  getDashboardInsights,
  getDashboardStats,
  getEmployeeDashboard,
  getTeamWorkload,
  getUpcomingWork,
} from "@/server/queries";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const user = auth.user as AuthUser;
    const staff = isStaff(user.role);

    if (!staff) {
      const [data, insights] = await Promise.all([
        getEmployeeDashboard(user),
        getDashboardInsights(user),
      ]);
      return NextResponse.json(
        { kind: "employee" as const, user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl }, data, insights },
        { headers: { "Cache-Control": "private, max-age=5" } },
      );
    }

    const [stats, team, work, extras, insights] = await Promise.all([
      getDashboardStats(user),
      getTeamWorkload(),
      getUpcomingWork(user),
      getDashboardExtras(user),
      getDashboardInsights(user),
    ]);

    return NextResponse.json(
      { kind: "staff" as const, user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl }, stats, team, work, extras, insights },
      { headers: { "Cache-Control": "private, max-age=5" } },
    );
  } catch (error) {
    console.error("GET /api/boot/dashboard", error);
    return jsonError("Could not load dashboard.", 500);
  }
}
