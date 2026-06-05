import { z } from "zod";

import { loginSchema } from "@/lib/zodSchemas";
import { authClient } from "@/lib/auth-client";

export async function signInWithEmail(values: z.infer<typeof loginSchema>) {
  const { error } = await authClient.signIn.email({
    email: values.email,
    password: values.password,
  });

  if (error) {
    return { error };
  }

  const session = await authClient.getSession();
  const role = session?.data?.user?.role?.toLowerCase();

  return { role };
}
