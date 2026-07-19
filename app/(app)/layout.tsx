import { redirect } from "next/navigation";
import { currentSeller } from "@/lib/session";
import { Shell } from "@/components/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const seller = await currentSeller();
  if (!seller) redirect("/login");
  if (!seller.onboarded) redirect("/onboarding");
  return <Shell seller={seller}>{children}</Shell>;
}
