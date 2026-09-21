"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { actionCatch, actionOk } from "@/components/shared/action-popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface, SectionTitle } from "@/components/shared/surface";
import { apiJson } from "@/lib/client-api";

export function ClientDrive({ id, driveUrl }: { id: string; driveUrl: string | null }) {
  const [saved, setSaved] = useState((driveUrl ?? "").trim());
  const [url, setUrl] = useState(saved);
  const [editing, setEditing] = useState(!saved);
  const [pending, setPending] = useState(false);

  return (
    <Surface>
      <SectionTitle title="Google Drive" description="Assign a Drive folder to this client." />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={url}
          readOnly={!editing}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://drive.google.com/..."
          className={!editing ? "bg-[#F9FAFB]" : undefined}
        />
        {editing ? (
          <Button
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                const next = url.trim();
                await apiJson(`/api/clients/${id}`, { method: "PATCH", json: { driveUrl: next } });
                setSaved(next);
                setUrl(next);
                setEditing(!next);
                actionOk(next ? "Drive link saved." : "Drive link removed.");
              } catch (error) {
                actionCatch(error);
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setUrl(saved);
              setEditing(true);
            }}
          >
            Edit
          </Button>
        )}
        {saved ? (
          <Button asChild variant="outline">
            <a href={saved} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Open Drive
            </a>
          </Button>
        ) : null}
      </div>
    </Surface>
  );
}
