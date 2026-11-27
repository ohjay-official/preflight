import { cleanName } from "@/lib/format";

export async function readAgentName(uri: string): Promise<string | null> {
  if (!uri) return null;
  if (uri.startsWith("data:application/json")) {
    const text = decodeDataUri(uri);
    return text ? nameFromJson(text) : null;
  }
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (text.length > 100_000) return null;
    return nameFromJson(text);
  } catch {
    return null;
  }
}

function decodeDataUri(uri: string): string | null {
  const comma = uri.indexOf(",");
  if (comma === -1) return null;
  const meta = uri.slice(0, comma);
  const data = uri.slice(comma + 1);
  try {
    if (meta.includes(";base64")) return Buffer.from(data, "base64").toString("utf8");
    return decodeURIComponent(data);
  } catch {
    return null;
  }
}

function nameFromJson(text: string): string | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return null;
    return cleanName((parsed as { name?: unknown }).name);
  } catch {
    return null;
  }
}
