"use client";

import { useState, useTransition } from "react";
import { actionCatch, actionOk } from "@/components/shared/action-popup";
import type { Client } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { updateClient } from "@/server/actions/clients";
import { useRouter } from "next/navigation";

export function ClientNotes({ client }: { client: Client }) {
  const router = useRouter();
  const [notes, setNotes] = useState(client.notes ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <Surface>
      <SectionTitle title="Important notes" />
      <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
      <Button
        className="mt-3"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await updateClient(client.id, {
                name: client.name,
                companyName: client.companyName ?? "",
                email: client.email ?? "",
                phone: client.phone ?? "",
                country: client.country ?? "",
                status: client.status,
                notes,
              });
              actionOk("Client saved successfully.");
              router.refresh();
            } catch (error) {
              actionCatch(error);
            }
          })
        }
      >
        Save notes
      </Button>
    </Surface>
  );
}
