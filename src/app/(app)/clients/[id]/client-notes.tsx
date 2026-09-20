"use client";

import { useState } from "react";
import { actionCatch, actionOk } from "@/components/shared/action-popup";
import type { Client } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { apiJson } from "@/lib/client-api";

export function ClientNotes({ client }: { client: Client }) {
  const [notes, setNotes] = useState(client.notes ?? "");
  const [pending, setPending] = useState(false);

  return (
    <Surface>
      <SectionTitle title="Important notes" />
      <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
      <Button
        className="mt-3"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          try {
            await apiJson(`/api/clients/${client.id}`, { method: "PATCH", json: { notes } });
            actionOk("Client saved successfully.");
          } catch (error) {
            actionCatch(error);
          } finally {
            setPending(false);
          }
        }}
      >
        Save notes
      </Button>
    </Surface>
  );
}
