"use client";

export async function clearCommunityPresence() {
  try {
    const response = await fetch("/api/community/presence", {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(
        "Could not clear community presence:",
        response.status
      );
    }
  } catch (error) {
    // Never prevent logout because presence cleanup failed.
    console.error("Community presence cleanup failed:", error);
  }
}