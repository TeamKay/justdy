import { redirect } from "next/navigation";

export default function EducatorProfilePage() {
  redirect("/educator?tab=profile");
}
