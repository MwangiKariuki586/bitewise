import { FeaturePlaceholder } from "@/components/product/feature-placeholder";
import { requireUser } from "@/lib/auth/session";

export default async function CookPage() {
  await requireUser();
  return <FeaturePlaceholder eyebrow="Cook" title="One clear step at a time." description="Scale ingredients, follow focused instructions, and find a useful tutorial when seeing the technique would help." accent="Confidence from prep to plate." />;
}
