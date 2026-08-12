import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkInGuest, fetchCheckInCount, NameRequiredError } from "./checkin";

function mockClient(rpcImpl: (fn: string, args: unknown) => Promise<{ data: unknown; error: unknown }>) {
  return { rpc: vi.fn(rpcImpl) } as unknown as SupabaseClient;
}

describe("checkInGuest", () => {
  it("checks in a known guest and returns the running total", async () => {
    const client = mockClient(async (fn, args) => {
      expect(fn).toBe("check_in_guest");
      expect(args).toEqual({ p_phone: "5550100100", p_name: null });
      return {
        data: [{ guest_name: "Ada Lovelace", is_new_guest: false, total_check_ins: 4 }],
        error: null,
      };
    });

    const result = await checkInGuest(client, "555-010-0100");

    expect(result).toEqual({ name: "Ada Lovelace", isNewGuest: false, totalCheckIns: 4 });
  });

  it("throws NameRequiredError when the phone is unknown and no name is given", async () => {
    const client = mockClient(async () => ({
      data: null,
      error: { message: "NAME_REQUIRED" },
    }));

    await expect(checkInGuest(client, "555-010-9999")).rejects.toBeInstanceOf(
      NameRequiredError
    );
  });

  it("creates and checks in a new guest when a name is supplied", async () => {
    const client = mockClient(async (fn, args) => {
      expect(args).toEqual({ p_phone: "5550109999", p_name: "Grace Hopper" });
      return {
        data: [{ guest_name: "Grace Hopper", is_new_guest: true, total_check_ins: 1 }],
        error: null,
      };
    });

    const result = await checkInGuest(client, "555-010-9999", "Grace Hopper");

    expect(result).toEqual({ name: "Grace Hopper", isNewGuest: true, totalCheckIns: 1 });
  });

  it("rejects a blank phone number without calling the backend", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient;

    await expect(checkInGuest(client, "   ")).rejects.toThrow(/phone number/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("surfaces other backend errors as-is", async () => {
    const client = mockClient(async () => ({
      data: null,
      error: { message: "connection refused" },
    }));

    await expect(checkInGuest(client, "555-010-0100")).rejects.toThrow(
      "connection refused"
    );
  });
});

describe("fetchCheckInCount", () => {
  it("returns the count from the RPC", async () => {
    const client = mockClient(async (fn) => {
      expect(fn).toBe("get_check_in_count");
      return { data: 7, error: null };
    });

    await expect(fetchCheckInCount(client)).resolves.toBe(7);
  });

  it("throws on error", async () => {
    const client = mockClient(async () => ({
      data: null,
      error: { message: "boom" },
    }));

    await expect(fetchCheckInCount(client)).rejects.toThrow("boom");
  });
});
