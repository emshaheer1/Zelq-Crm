import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AUTH_HOLD_COOKIE } from "@/lib/constants";
import { LoginScreen } from "./login-screen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const hold = (await cookies()).get(AUTH_HOLD_COOKIE)?.value;
  if (user && params.preview !== "1" && !hold) redirect("/dashboard");

  return <LoginScreen />;
}
