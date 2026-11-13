import { redirect } from "next/navigation";

type PostPageProps = {
  params: Promise<{ postId: string }>;
};

/**
 * Individual post pages are no longer used by the community feed.
 * Images open in the in-feed image viewer instead.
 */
export default async function SocialPostPage({
  params,
}: PostPageProps) {
  await params;
  redirect("/");
}
