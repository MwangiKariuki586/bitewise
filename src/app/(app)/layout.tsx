import { AppShell } from "@/components/navigation/app-shell";

interface ProductLayoutProps {
  children: React.ReactNode;
}

export default function ProductLayout({ children }: ProductLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
