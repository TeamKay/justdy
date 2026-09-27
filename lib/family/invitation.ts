import "server-only";

import crypto from "crypto";
import { env } from "@/lib/env";

const INVITE_TTL_SECONDS = 60 * 60 * 24 * 7;

type FamilyInvitationPayload = {
  familyId: string;
  inviterId: string;
  childEmail: string;
  exp: number;
  nonce: string;
};

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string) {
  return crypto
    .createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(payload)
    .digest("base64url");
}

export function createFamilyInvitationToken({
  familyId,
  inviterId,
  childEmail,
}: {
  familyId: string;
  inviterId: string;
  childEmail: string;
}) {
  const payload: FamilyInvitationPayload = {
    familyId,
    inviterId,
    childEmail: childEmail.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + INVITE_TTL_SECONDS,
    nonce: crypto.randomBytes(16).toString("hex"),
  };

  const encoded = encode(JSON.stringify(payload));
  return `${encoded}.${signature(encoded)}`;
}

export function verifyFamilyInvitationToken(token: string): FamilyInvitationPayload | null {
  try {
    const [encoded, providedSignature] = token.split(".");
    if (!encoded || !providedSignature) return null;

    const expectedSignature = signature(encoded);
    const a = Buffer.from(providedSignature);
    const b = Buffer.from(expectedSignature);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(decode(encoded)) as FamilyInvitationPayload;

    if (
      typeof payload.familyId !== "string" ||
      typeof payload.inviterId !== "string" ||
      typeof payload.childEmail !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
