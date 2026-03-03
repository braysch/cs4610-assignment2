import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import SignOutButton from "@/app/components/SignOutButton";

// vi.hoisted() ensures these mocks are initialised before the vi.mock() factory
// closures run (vi.mock calls are hoisted to the top of the file by Vitest).
const { mockPush, mockSignOut } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: mockSignOut },
  }),
}));

describe("SignOutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: signOut resolves successfully.
    mockSignOut.mockResolvedValue({});
  });

  it("renders a button", () => {
    render(<SignOutButton />);
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
  });

  it("calls signOut when clicked", async () => {
    const user = userEvent.setup();
    render(<SignOutButton />);

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("redirects to /home after signing out", async () => {
    const user = userEvent.setup();
    render(<SignOutButton />);

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(mockPush).toHaveBeenCalledWith("/home");
  });
});
