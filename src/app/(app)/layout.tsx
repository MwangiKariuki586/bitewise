import { Suspense } from "react";

import { AppShell } from "@/components/navigation/app-shell";
import { ProfileMenu } from "@/components/navigation/profile-menu";

interface ProductLayoutProps {
  children: React.ReactNode;
}

export default function ProductLayout({ children }: ProductLayoutProps) {
  return (
    <AppShell
      accountMenu={
        <Suspense fallback={<span className="size-10 animate-pulse rounded-full bg-muted" aria-label="Loading account menu" />}>
          <ProfileMenu />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
