"use client";

import { useSession } from "@/lib/auth-client";

export default function JoinCommunityButton({
  slug,
  price,
  onOpenModal,
}: {
  slug: string;
  price: number;
  onOpenModal: () => void;
}) {
  const { data: session, isPending } = useSession();

  const handleJoin = () => {
    if (isPending) return;

    if (!session?.user) {
      window.location.href = `/login?callbackUrl=/communities/${slug}`;
      return;
    }

    // ❌ no navigation anymore
    onOpenModal?.();
  };

  return (
    <button
      onClick={handleJoin}
      className="flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700"
    >
      JOIN {price === 0 ? "FREE" : `$${price}/month`}
    </button>
  );
}
