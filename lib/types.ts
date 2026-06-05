import { auth } from "./auth";

export type ApiResponse = {
  status: "success" | "error";
  message: string;
};

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"] & {
  role: "Admin" | "Educator" | "Learner";
};
