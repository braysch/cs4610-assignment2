import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

// Replace the entire server module so next/headers is never imported.
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("getUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no session exists", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const result = await getUser();
    expect(result).toBeNull();
  });

  it("returns the user object when a session exists", async () => {
    const fakeUser = { id: "abc-123", email: "test@example.com" };

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: fakeUser } }),
      },
    } as never);

    const result = await getUser();
    expect(result).toEqual(fakeUser);
  });
});
