import { checkUser } from "../actions/checkUser";

import { NavbarClient } from "./NavbarClient";

export default async function NavbarServer() {
  const user = await checkUser();

  const safeUser = user ?? null;

  // if (safeUser?.role === "Student") {
  //   await checkAndAllocateCredits(safeUser);
  // }

  return <NavbarClient user={safeUser} />;
}
