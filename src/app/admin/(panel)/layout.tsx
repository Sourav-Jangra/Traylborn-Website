import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/server/auth/session";

// Layouts don't re-run on every navigation, so each page and server action also
// calls requireAdmin(); this check only supplies the signed-in admin to the shell.
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell admin={{ name: admin.name, email: admin.email }}>{children}</AdminShell>;
}
