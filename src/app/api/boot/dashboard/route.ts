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

function parsePeriod(url: URL) {
  const now = new Date();
  const year = Number(url.searchParams.get("year")) || now.getFullYear();
  const month = Number(url.searchParams.get("month")) || now.getMonth() + 1;
  const safeMonth = Math.min(12, Math.max(1, month));
  const isCurrent = year === now.getFullYear() && safeMonth === now.getMonth() + 1;
  return { year, month: safeMonth, isCurrent };
}

export async function GET(request: Request) {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;
    const user = auth.user as AuthUser;
    const staff = isStaff(user.role);
    const period = parsePeriod(new URL(request.url));

    if (!staff) {
      const [data, insights] = await Promise.all([
        getEmployeeDashboard(user, period),
        getDashboardInsights(user, period),
      ]);
      return NextResponse.json(
        {
          kind: "employee" as const,
          period,
          user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
          data,
          insights,
        },
        { headers: { "Cache-Control": "private, max-age=5" } },
      );
    }

    const [stats, team, work, extras, insights] = await Promise.all([
      getDashboardStats(user, period),
      getTeamWorkload(period),
      getUpcomingWork(user, period),
      getDashboardExtras(user),
      getDashboardInsights(user, period),
    ]);

    return NextResponse.json(
      {
        kind: "staff" as const,
        period,
        user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
        stats,
        team,
        work,
        extras,
        insights,
      },
      { headers: { "Cache-Control": "private, max-age=5" } },
    );
  } catch (error) {
    console.error("GET /api/boot/dashboard", error);
    return jsonError("Could not load dashboard.", 500);
  }
}
