import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentProfile: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/features/profile/data", () => ({
  getCurrentProfile: mocks.getCurrentProfile,
}));
vi.mock("@/features/profile/onboarding-form", () => ({
  OnboardingForm: ({ formPath }: { formPath: string }) => (
    <div data-testid="profile-form" data-form-path={formPath} />
  ),
}));

import { ProfileFormPage } from "@/features/profile/profile-form-page";

describe("ProfileFormPage gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  it("keeps completed profiles out of onboarding", async () => {
    mocks.getCurrentProfile.mockResolvedValue({
      profile: { onboarding_completed: true },
    });

    await expect(
      ProfileFormPage({ mode: "onboarding", returnTo: "/eat-now" }),
    ).rejects.toThrow("NEXT_REDIRECT:/eat-now");
  });

  it("uses the dedicated edit route for completed profiles", async () => {
    mocks.getCurrentProfile.mockResolvedValue({
      profile: { onboarding_completed: true },
    });

    render(
      await ProfileFormPage({ mode: "edit", returnTo: "/profile" }),
    );
    expect(screen.getByTestId("profile-form")).toHaveAttribute(
      "data-form-path",
      "/profile/edit",
    );
  });
});
