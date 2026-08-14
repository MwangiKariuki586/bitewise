import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getSessionIdentity: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/session", () => ({
  getSessionIdentity: mocks.getSessionIdentity,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import HomePage from "@/app/page";

function profileClient(onboardingCompleted: boolean) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: { onboarding_completed: onboardingCompleted },
    error: null,
  });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  return { from: vi.fn(() => ({ select })) };
}

describe("landing-page authentication boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  it("keeps the public landing page available to signed-out visitors", async () => {
    mocks.getSessionIdentity.mockResolvedValue(null);

    render(await HomePage());

    expect(
      screen.getByRole("heading", { level: 1, name: /what should we eat/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Landing navigation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Whatever today looks like." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "From decision to dinner." })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Find my next meal" })).toHaveLength(2);
    for (const link of screen.getAllByRole("link", { name: "Find my next meal" })) {
      expect(link).toHaveAttribute("href", "/eat-now");
    }
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("sends fully onboarded users directly to Eat Now", async () => {
    mocks.getSessionIdentity.mockResolvedValue({
      sub: "7af66ed8-8f6e-467f-88e4-5296940e1e08",
    });
    mocks.createClient.mockResolvedValue(profileClient(true));

    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/eat-now");
    expect(mocks.redirect).toHaveBeenCalledWith("/eat-now");
  });

  it("resumes onboarding for authenticated users with an incomplete profile", async () => {
    mocks.getSessionIdentity.mockResolvedValue({
      sub: "7af66ed8-8f6e-467f-88e4-5296940e1e08",
    });
    mocks.createClient.mockResolvedValue(profileClient(false));

    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/onboarding");
    expect(mocks.redirect).toHaveBeenCalledWith("/onboarding");
  });
});
