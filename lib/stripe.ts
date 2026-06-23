import "server-only";

import { env } from "./env";
import Stripe from "stripe";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
});
