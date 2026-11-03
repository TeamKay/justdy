import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import GameHistoryClient from "@/app/_components/games/GameHistoryClient";

export const dynamic = "force-dynamic";

export default async function GameHistoryPage() {
  const user = await getAuthenticatedUser();

  if (!user) redirect("/signin?callbackUrl=/dashboard/games");

  return <GameHistoryClient />;
}
