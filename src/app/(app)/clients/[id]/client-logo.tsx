"use client";

import { useState } from "react";
import { actionCatch, actionOk } from "@/components/shared/action-popup";
import { ClientAvatar } from "@/components/shared/user-avatar";
import { apiJson } from "@/lib/client-api";
import { compressLogo } from "@/lib/client-logo";

export function ClientLogo({
  id,
  name,
  logoUrl,
}: {
  id: string;
  name: string;
  logoUrl: string | null;
}) {
  const [src, setSrc] = useState(logoUrl);
  const [pending, setPending] = useState(false);

  return (
    <label className="relative shrink-0 cursor-pointer" title="Upload logo">
      <ClientAvatar name={name} src={src} className="size-14" />
      <span className="sr-only">Upload client logo</span>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={pending}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setPending(true);
          try {
            const next = await compressLogo(file);
            await apiJson(`/api/clients/${id}`, { method: "PATCH", json: { logoUrl: next } });
            setSrc(next);
            actionOk("Client logo saved.");
          } catch (error) {
            actionCatch(error);
          } finally {
            setPending(false);
          }
        }}
      />
    </label>
  );
}
