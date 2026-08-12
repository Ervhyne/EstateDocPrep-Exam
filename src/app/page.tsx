"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { checkInGuest, fetchCheckInCount, NameRequiredError } from "@/lib/checkin";

type Status =
  | { kind: "idle" }
  | { kind: "success"; name: string; isNewGuest: boolean }
  | { kind: "error"; message: string };

export default function Home() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [total, setTotal] = useState<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCheckInCount(supabase)
      .then(setTotal)
      .catch(() => setTotal(null));
  }, []);

  useEffect(() => {
    if (needsName) nameInputRef.current?.focus();
  }, [needsName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || submitting) return;

    setSubmitting(true);
    setStatus({ kind: "idle" });

    try {
      const result = await checkInGuest(supabase, phone, needsName ? name : undefined);
      setStatus({ kind: "success", name: result.name, isNewGuest: result.isNewGuest });
      setTotal(result.totalCheckIns);
      setPhone("");
      setName("");
      setNeedsName(false);
    } catch (err) {
      if (err instanceof NameRequiredError) {
        setNeedsName(true);
        setStatus({ kind: "idle" });
      } else {
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    if (needsName) {
      setNeedsName(false);
      setName("");
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-1">Event Check-In</h1>
        <p className="text-center text-sm text-gray-500 mb-8">
          Enter a phone number to check in
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 555-010-0100"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            />
          </div>

          {needsName && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                We don&apos;t recognize that number — what&apos;s your name?
              </label>
              <input
                id="name"
                ref={nameInputRef}
                type="text"
                autoComplete="name"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !phone.trim() || (needsName && !name.trim())}
            className="w-full rounded-md bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Checking in…" : needsName ? "Add & check in" : "Check in"}
          </button>
        </form>

        <div className="mt-6 min-h-[3rem]" role="status" aria-live="polite">
          {status.kind === "success" && (
            <p className="text-center text-green-700 font-medium">
              Checked in: {status.name}
              {status.isNewGuest && (
                <span className="block text-xs font-normal text-green-600">
                  New guest added
                </span>
              )}
            </p>
          )}
          {status.kind === "error" && (
            <p className="text-center text-red-600">{status.message}</p>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Total check-ins:{" "}
          <span className="font-semibold text-gray-900">{total ?? "—"}</span>
        </p>
      </div>
    </main>
  );
}
