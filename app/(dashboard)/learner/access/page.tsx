import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LearnerAccessPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/learner/products");
  }

  redirect("/?login=true&callbackUrl=%2Flearner%2Fproducts");
}
