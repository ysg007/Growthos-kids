import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ParentSidebar from "@/components/dashboard/ParentSidebar";
import ParentTopBar from "@/components/dashboard/ParentTopBar";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: childrenData }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("children").select("*").eq("parent_id", user.id).is("deleted_at", null).order("created_at"),
  ]);

  if (profile && !profile.onboarded) redirect("/auth/onboarding");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--surface-muted)" }}>
      <ParentSidebar user={profile} children={childrenData ?? []} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ParentTopBar user={profile} />
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
