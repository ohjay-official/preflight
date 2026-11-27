"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export function AddressForm({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = value.trim();
    if (!ADDRESS.test(next)) {
      setError("Enter a Celo address, 0x followed by 40 hex characters.");
      return;
    }
    setError("");
    router.push(`/report/${next}`);
  }

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="agent-address">Agent wallet address</label>
      <div className="form-row">
        <input
          id="agent-address"
          name="address"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="0x"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          maxLength={42}
        />
        <button type="submit">Run check</button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
