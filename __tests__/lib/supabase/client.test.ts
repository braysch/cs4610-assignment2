import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/client";

// Mock the underlying SSR package so we can inspect what args are passed.
const mockCreateBrowserClient = vi.hoisted(() => vi.fn());

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mockCreateBrowserClient,
}));

describe("createClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateBrowserClient.mockReturnValue({ auth: {} });
  });

  it("returns an object with an auth property", () => {
    const client = createClient();
    expect(client).toHaveProperty("auth");
  });

  it("passes NEXT_PUBLIC_SUPABASE_URL to createBrowserClient", () => {
    createClient();
    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  });
});
