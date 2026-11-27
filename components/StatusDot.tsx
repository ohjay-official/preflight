import type { CheckStatus } from "@/lib/types";

const TONE: Record<CheckStatus, string> = {
  Live: "live",
  Revoked: "revoked",
  Expired: "expired",
  "Not found": "missing",
  Unread: "unread",
};

export function StatusDot({ status }: { status: CheckStatus }) {
  return (
    <span className={`status status-${TONE[status]}`}>
      <span className="dot" aria-hidden="true" />
      {status}
    </span>
  );
}
