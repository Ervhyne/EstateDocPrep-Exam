import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePhone } from "./phone";

export type CheckInResult = {
  name: string;
  isNewGuest: boolean;
  totalCheckIns: number;
};

export class NameRequiredError extends Error {
  constructor() {
    super("NAME_REQUIRED");
    this.name = "NameRequiredError";
  }
}

/**
 * Calls the `check_in_guest` RPC. If the phone number is unknown and no name
 * was supplied, the database raises NAME_REQUIRED, which we surface as a
 * typed error so the UI can prompt for a name and retry.
 */
export async function checkInGuest(
  client: SupabaseClient,
  phoneInput: string,
  name?: string
): Promise<CheckInResult> {
  const phone = normalizePhone(phoneInput);
  if (!phone) {
    throw new Error("Please enter a phone number.");
  }

  const trimmedName = name?.trim();

  const { data, error } = await client.rpc("check_in_guest", {
    p_phone: phone,
    p_name: trimmedName && trimmedName.length > 0 ? trimmedName : null,
  });

  if (error) {
    if (error.message.includes("NAME_REQUIRED")) {
      throw new NameRequiredError();
    }
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Check-in failed: no response from server.");
  }

  return {
    name: row.guest_name,
    isNewGuest: row.is_new_guest,
    totalCheckIns: Number(row.total_check_ins),
  };
}

/** Fetches the current running total, for initial page load. */
export async function fetchCheckInCount(client: SupabaseClient): Promise<number> {
  const { data, error } = await client.rpc("get_check_in_count");
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}
