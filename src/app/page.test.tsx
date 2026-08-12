import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

const rpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));

beforeEach(() => {
  rpc.mockReset();
});

describe("Home (check-in page)", () => {
  it("checks in a known guest and increments the running total", async () => {
    const user = userEvent.setup();
    rpc
      .mockResolvedValueOnce({ data: 2, error: null }) // initial fetchCheckInCount
      .mockResolvedValueOnce({
        data: [{ guest_name: "Ada Lovelace", is_new_guest: false, total_check_ins: 3 }],
        error: null,
      });

    render(<Home />);

    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());

    await user.type(screen.getByLabelText(/phone number/i), "5550100100");
    await user.click(screen.getByRole("button", { name: /check in/i }));

    expect(await screen.findByText(/checked in: ada lovelace/i)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("prompts for a name when the phone number is unknown, then checks in", async () => {
    const user = userEvent.setup();
    rpc
      .mockResolvedValueOnce({ data: 0, error: null }) // initial count
      .mockResolvedValueOnce({ data: null, error: { message: "NAME_REQUIRED" } })
      .mockResolvedValueOnce({
        data: [{ guest_name: "Grace Hopper", is_new_guest: true, total_check_ins: 1 }],
        error: null,
      });

    render(<Home />);
    await waitFor(() => expect(screen.getByText("0")).toBeInTheDocument());

    await user.type(screen.getByLabelText(/phone number/i), "5550109999");
    await user.click(screen.getByRole("button", { name: /check in/i }));

    const nameInput = await screen.findByLabelText(/what's your name/i);
    await user.type(nameInput, "Grace Hopper");
    await user.click(screen.getByRole("button", { name: /add & check in/i }));

    expect(await screen.findByText(/checked in: grace hopper/i)).toBeInTheDocument();
    expect(screen.getByText(/new guest added/i)).toBeInTheDocument();
    expect(rpc).toHaveBeenLastCalledWith("check_in_guest", {
      p_phone: "5550109999",
      p_name: "Grace Hopper",
    });
  });

  it("shows an error message when the backend call fails", async () => {
    const user = userEvent.setup();
    rpc
      .mockResolvedValueOnce({ data: 0, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "network error" } });

    render(<Home />);
    await waitFor(() => expect(screen.getByText("0")).toBeInTheDocument());

    await user.type(screen.getByLabelText(/phone number/i), "5550100100");
    await user.click(screen.getByRole("button", { name: /check in/i }));

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });
});
