import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/shared/icon-box";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <IconBox icon={ShieldAlert} tone="red" />
      <p className="mt-4 text-sm font-medium text-muted-foreground">403</p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground">You don&apos;t have access to this page.</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This screen is limited to managers and admins.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
