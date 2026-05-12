import EducatorProfile from "@/app/_components/educator-profile";
import {
  getAvailableTimeSlots,
  getEducatorById,
} from "@/app/actions/appointments";
import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default async function EducatorIDPage({ params }: PageProps) {
  const { id } = await params;

  let educatorData;
  let slotsData;

  try {
    [educatorData, slotsData] = await Promise.all([
      getEducatorById(id),
      getAvailableTimeSlots(id),
    ]);
  } catch (error) {
    console.error("Error loading educator profile", error);
    redirect("/educators");
  }

  return (
    <EducatorProfile
      educator={{
        ...educatorData.educator,
        imageUrl: educatorData.educator.imageUrl ?? undefined,
      }}
      availableDays={slotsData.days || []}
    />
  );
}

// import {
//   getAvailableTimeSlots,
//   getEducatorById,
// } from "@/app/actions/appointments";
// import { redirect } from "next/navigation";

// import EducatorProfile from "@/app/_components/educator-profile";

// interface PageProps {
//   params: Promise<{ id: string }>;
// }

// export default async function EducatorIDPage({ params }: PageProps) {
//   const { id } = await params;

//   let educatorData;
//   let slotsData;

//   try {
//     // Fetch both educator + availability
//     [educatorData, slotsData] = await Promise.all([
//       getEducatorById(id),
//       getAvailableTimeSlots(id),
//     ]);
//   } catch (error) {
//     console.error("Error loading educator profile", error);
//     redirect("/educators");
//   }

//   return (
//     <EducatorProfile
//       educator={{
//         ...educatorData.educator,
//         imageUrl: educatorData.educator.imageUrl ?? undefined,
//       }}
//       availableDays={slotsData.days || []}
//     />
//   );
// }
