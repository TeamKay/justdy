import { redirect } from "next/navigation";

export default function EducatorAvailabilityPage() {
  redirect("/educator?tab=availability");
}
