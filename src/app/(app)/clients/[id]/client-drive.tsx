"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { actionCatch, actionOk } from "@/components/shared/action-popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { apiJson } from "@/lib/client-api";

export function ClientDrive({ id, driveUrl }: { id: string; driveUrl: string | null }) {
  const [url, setUrl] = useState(driveUrl ?? "");
  const [pending, setPending] = useState(false);

  return (
    <Surface>
      <SectionTitle title="Google Drive" description="Assign a Drive folder to this client." />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://drive.google.com/..."
        />
        <Button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              await apiJson(`/api/clients/${id}`, { method: "PATCH", json: { driveUrl: url } });
              actionOk("Drive link saved.");
            } catch (error) {
              actionCatch(error);
            } finally {
              setPending(false);
            }
          }}
        >
          Save Drive link
        </Button>
        {url ? (
          <Button asChild variant="outline">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Open Drive
            </a>
          </Button>
        ) : null}
      </div>
    </Surface>
  );
}
