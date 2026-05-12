// "use server";

// import { auth } from "@/lib/auth";
// import { Prisma } from "@/lib/generated/prisma/client";
// import prisma from "@/lib/prisma";
// import { format } from "date-fns";
// import { revalidatePath } from "next/cache";
// import { headers } from "next/headers";
// import {
//   TransactionType,
//   Plan_Credits,
//   Plan_Prices,
//   Appointment_Credit_Cost,
// } from "@/lib/credit-constants";

// type UserWithTransactions = Prisma.UserGetPayload<{
//   include: {
//     transactions: true;
//   };
// }>;

// export async function checkAndAllocateCredits(
//   user: UserWithTransactions | null,
// ) {
//   try {
//     if (!user) return null;

//     if (user.role !== "Student") return user;

//     // Fetch latest session (optional for future auth logic)
//     await auth.api.getSession({
//       headers: await headers(),
//     });

//     // 🔥 Get user with properly ordered transactions
//     const userWithTransactions = await prisma.user.findUnique({
//       where: { id: user.id },
//       include: {
//         transactions: {
//           orderBy: { createdAt: "desc" },
//         },
//       },
//     });

//     if (!userWithTransactions) return user;

//     const latestTransaction = userWithTransactions.transactions?.[0];

//     const currentPlan = latestTransaction?.packageId ?? "free_user";

//     const creditToAllocate =
//       Plan_Credits[currentPlan as keyof typeof Plan_Credits] ?? 0;

//     // If no valid plan or zero credits, exit
//     if (!currentPlan || creditToAllocate <= 0) {
//       return user;
//     }

//     const currentMonth = format(new Date(), "yyyy-MM");

//     // Prevent duplicate monthly allocation
//     if (latestTransaction) {
//       const transactionMonth = format(
//         new Date(latestTransaction.createdAt),
//         "yyyy-MM",
//       );

//       if (
//         transactionMonth === currentMonth &&
//         latestTransaction.packageId === currentPlan
//       ) {
//         return user;
//       }
//     }

//     // 🔥 Transaction: create credit log + update user credits
//     const updatedUser = await prisma.$transaction(async (tx) => {
//       await tx.creditTransaction.create({
//         data: {
//           userId: user.id,
//           amount: creditToAllocate,
//           type: TransactionType.CREDIT_PURCHASE,
//           packageId: currentPlan,
//           price: Plan_Prices[currentPlan as keyof typeof Plan_Prices] ?? 0,
//         },
//       });

//       return await tx.user.update({
//         where: { id: user.id },
//         data: {
//           credits: {
//             increment: creditToAllocate,
//           },
//         },
//       });
//     });

//     // Refresh UI pages
//     revalidatePath("/educators");
//     revalidatePath("/student");

//     return updatedUser;
//   } catch (error: unknown) {
//     console.error(
//       "Failed to check subscription and allocate credits:",
//       error || error,
//     );
//     return user;
//   }
// }

// export async function deductCreditsForAppointment(
//   studentId: string,
//   educatorId: string,
// ) {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: studentId },
//     });

//     const educator = await prisma.user.findUnique({
//       where: { id: educatorId },
//     });

//     if ((user?.credits ?? 0) < Appointment_Credit_Cost) {
//       throw new Error("Insufficient credits to book an appointment");
//     }

//     if (!educator) {
//       throw new Error("Educator not found");
//     }

//     const result = await prisma.$transaction(async (tx) => {
//       await tx.creditTransaction.create({
//         data: {
//           userId: studentId,
//           amount: -Appointment_Credit_Cost,
//           type: TransactionType.APPOINTMENT_DEDUCTION,
//           packageId: "appointment",
//           price: 0,
//         },
//       });

//       await tx.creditTransaction.create({
//         data: {
//           userId: educatorId,
//           amount: Appointment_Credit_Cost,
//           type: TransactionType.APPOINTMENT_DEDUCTION,
//           packageId: "appointment",
//           price: 0,
//         },
//       });

//       const updateUser = await tx.user.update({
//         where: {
//           id: studentId,
//         },
//         data: {
//           credits: {
//             decrement: Appointment_Credit_Cost,
//           },
//         },
//       });

//       await tx.user.update({
//         where: {
//           id: educator.id,
//         },
//         data: {
//           credits: {
//             increment: Appointment_Credit_Cost,
//           },
//         },
//       });
//       return updateUser;
//     });
//     return { success: true, user: result };
//   } catch (error) {
//     throw new Error(
//       error instanceof Error ? error.message : "Credit deduction failed",
//     );
//   }
// }
