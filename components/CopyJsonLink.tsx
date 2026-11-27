"use client";

import { useState } from "react";

export function CopyJsonLink({ url }: { url: string }) {
  const [note, setNote] = useState("");

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setNote("Copied");
    } catch {
      setNote("Select the link and copy it");
    }
  }

  return (
    <div className="json-link">
      <label htmlFor="json-link">JSON link</label>
      <div className="form-row">
        <input id="json-link" readOnly value={url} />
        <button type="button" onClick={onCopy}>
          Copy JSON link
        </button>
      </div>
      {note ? <p className="muted">{note}</p> : null}
    </div>
  );
}
