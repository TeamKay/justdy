import { redirect } from "next/navigation";

export default function EducatorServicesPage() {
  redirect("/educator?tab=services");
}
