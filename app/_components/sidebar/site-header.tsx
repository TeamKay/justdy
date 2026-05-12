import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { HeaderWelcome } from "./header-welcome";
import { SiteHeaderClient } from "./site-header-client";

export async function SiteHeader() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const name = session?.user?.name ?? "User";

  return (
    <div className="sticky top-0 z-40">
      <SiteHeaderClient>
        <HeaderWelcome name={name} />
      </SiteHeaderClient>
    </div>
  );
}
