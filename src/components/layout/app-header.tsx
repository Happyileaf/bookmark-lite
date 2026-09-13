import { auth } from "@/server/auth/auth";
import { HeaderActions } from "@/components/layout/header-actions";
import { getUserAvatarLabel } from "@/lib/user-label";

export async function AppHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <HeaderActions
      isAuthed={!!user}
      name={user?.name ?? null}
      email={user?.email ?? null}
      isAdmin={user?.role === "super_admin"}
      userLabel={getUserAvatarLabel(user?.name ?? null, user?.email ?? null)}
    />
  );
}
