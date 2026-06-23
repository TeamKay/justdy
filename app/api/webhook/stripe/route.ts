import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { resend } from "@/lib/resend";
import { env } from "@/lib/env";
import { render } from "@react-email/render";
import crypto from "crypto";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

function parseDateTime(dateStr: string, timeStr: string): Date {
  const [datePart] = dateStr.split("T");
  const [time, modifier] = timeStr.split(" ");

  const parts = time.split(":").map(Number);
  let hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const date = new Date(datePart);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    console.log(
      `⚓ Webhook received: checkout.session.completed [${session.id}]`,
    );

    try {
      let stripeCustomerId = session.customer as string | null;

      const email =
        session.metadata?.billingEmail || session.customer_details?.email;
      const name =
        session.metadata?.billingName ||
        session.customer_details?.name ||
        "Learner Account";

      if (!stripeCustomerId && email) {
        console.log(
          `ℹ️ stripeCustomerId missing from session. Creating one for ${email}...`,
        );
        const customer = await stripe.customers.create({
          email: email,
          name: name,
        });
        stripeCustomerId = customer.id;
      }

      const emailPayload = await prisma.$transaction(async (tx) => {
        const pendingEnrollment = await tx.pendingEnrollment.findUnique({
          where: { stripeSessionId: session.id },
        });

        const finalEmail = pendingEnrollment?.email || email;
        const finalName = pendingEnrollment?.name || name;

        if (!finalEmail) {
          throw new Error("Critical context missing: No customer email found.");
        }

        const targetEducatorId =
          pendingEnrollment?.educatorId || session.metadata?.educatorId;
        const subject =
          pendingEnrollment?.subject ||
          session.metadata?.subject ||
          "Tutoring Session";
        const gradeLevel =
          pendingEnrollment?.gradeLevel ||
          session.metadata?.gradeLevel ||
          "N/A";
        const topic = pendingEnrollment?.topic || session.metadata?.topic || "";

        let finalStartDate: Date;
        let finalEndDate: Date;
        let finalSessionDate: Date;

        if (pendingEnrollment) {
          finalStartDate = pendingEnrollment.startTime;
          finalEndDate = pendingEnrollment.endTime;
          finalSessionDate = pendingEnrollment.sessionDate;
        } else if (
          session.metadata?.sessionDate &&
          session.metadata?.startTime &&
          session.metadata?.endTime
        ) {
          finalStartDate = parseDateTime(
            session.metadata.sessionDate,
            session.metadata.startTime,
          );
          finalEndDate = parseDateTime(
            session.metadata.sessionDate,
            session.metadata.endTime,
          );
          finalSessionDate = new Date(session.metadata.sessionDate);
        } else {
          throw new Error("Unable to parse session timeline dates.");
        }

        let finalEducatorId = targetEducatorId || null;
        if (finalEducatorId) {
          const educatorExists = await tx.user.findUnique({
            where: { id: finalEducatorId },
          });
          if (!educatorExists) finalEducatorId = null;
        }

        if (!finalEducatorId) {
          const fallbackEducator = await tx.user.findFirst({
            where: { role: "Educator" },
          });
          if (!fallbackEducator) throw new Error("No valid educator found.");
          finalEducatorId = fallbackEducator.id;
        }

        const educator = await tx.user.findUnique({
          where: { id: finalEducatorId },
        });
        let educatorEmail = "";
        let educatorName = "Educator";
        if (educator) {
          educatorEmail = educator.email;
          educatorName = educator.name || "Educator";
        }

        let user = await tx.user.findUnique({ where: { email: finalEmail } });

        if (!user) {
          user = await tx.user.create({
            data: {
              email: finalEmail,
              name: finalName,
              stripeCustomerId: stripeCustomerId,
              role: "Learner",
            },
          });
        } else {
          const updateData: Partial<
            Pick<typeof user, "stripeCustomerId" | "role">
          > = {};
          if (!user.stripeCustomerId && stripeCustomerId) {
            updateData.stripeCustomerId = stripeCustomerId;
          }
          if (user.role !== "Admin" && user.role !== "Educator") {
            updateData.role = "Learner";
          }
          if (Object.keys(updateData).length > 0) {
            user = await tx.user.update({
              where: { id: user.id },
              data: updateData,
            });
          }
        }

        // Generating random unique token ID matching your schema criteria
        const tokenValue = crypto.randomBytes(32).toString("hex");
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Matching your schema exactly: model Verification { id, identifier, value, expiresAt }
        await tx.verification.create({
          data: {
            id: crypto.randomUUID(),
            identifier: user.email,
            value: tokenValue,
            expiresAt: tokenExpires,
          },
        });

        await tx.transaction.create({
          data: {
            userId: user.id,
            amount: session.amount_total ?? 0,
            stripeSessionId: session.id,
            status: "Paid",
          },
        });

        await tx.appointment.create({
          data: {
            learnerId: user.id,
            educatorId: finalEducatorId,
            subject: subject,
            gradeLevel: gradeLevel,
            date: finalSessionDate,
            startTime: finalStartDate,
            endTime: finalEndDate,
            learnerDescription: topic,
            status: "Scheduled",
            payoutStatus: "Unpaid",
            stripeCheckoutSessionId: session.id,
          },
        });

        if (pendingEnrollment) {
          await tx.pendingEnrollment.update({
            where: { id: pendingEnrollment.id },
            data: { status: "Completed" },
          });
        }

        // Resiliently fallback on base application URL options
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          env.BETTER_AUTH_URL ||
          "http://localhost:3000";
        const verificationUrl = `${baseUrl}/api/auth/verify?token=${tokenValue}`;

        return {
          learnerEmail: user.email,
          learnerName: user.name || "Learner",
          educatorEmail,
          educatorName,
          verificationUrl,
          appointmentDetails: {
            subject,
            date: finalSessionDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            startTime: finalStartDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            endTime: finalEndDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        };
      });

      // -------------------------------------------------------------
      // 🚀 ASYNC EMAILS TRIGGER OUTSIDE TRANSACTION BLOCKS
      // -------------------------------------------------------------
      try {
        const {
          appointmentDetails: details,
          learnerName,
          learnerEmail,
          educatorEmail,
          educatorName,
          verificationUrl,
        } = emailPayload;

        const LearnerBookingConfirmedEmail = (
          await import("@/app/_components/LearnerBookingConfirmedEmail")
        ).default;

        const learnerHtml = await render(
          LearnerBookingConfirmedEmail({
            username: learnerName,
            subject: details.subject,
            date: details.date,
            time: `${details.startTime} - ${details.endTime}`,
            amountPaid: session.amount_total
              ? (session.amount_total / 100).toFixed(2)
              : "0.00",
            verificationUrl: verificationUrl,
          }),
        );

        await resend.emails.send({
          from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
          to: learnerEmail,
          subject: "Appointment Confirmed & Verify Your Email!",
          html: learnerHtml,
        });

        if (educatorEmail) {
          const EducatorSessionScheduledEmail = (
            await import("@/app/_components/EducatorSessionScheduledEmail")
          ).default;

          const educatorHtml = await render(
            EducatorSessionScheduledEmail({
              educatorName: educatorName,
              learnerName: learnerName,
              subject: details.subject,
              date: details.date,
              time: `${details.startTime} - ${details.endTime}`,
            }),
          );

          await resend.emails.send({
            from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
            to: educatorEmail,
            subject: "New Student Session Scheduled",
            html: educatorHtml,
          });
        }
      } catch (emailErr) {
        console.error(
          "⚠️ Database write succeeded, but session emails failed:",
          emailErr,
        );
      }

      return NextResponse.json({ received: true });
    } catch (dbErr) {
      console.error("❌ TRANSACTION CRASHED:", dbErr);
      return new NextResponse(`Database execution failed`, { status: 500 });
    }
  }
}

// import { stripe } from "@/lib/stripe";
// import prisma from "@/lib/prisma";
// import { headers } from "next/headers";
// import { NextResponse } from "next/server";
// import Stripe from "stripe";
// import { resend } from "@/lib/resend"; // or whatever your correct relative path is
// import { env } from "@/lib/env";
// import { render } from "@react-email/render";

// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// function parseDateTime(dateStr: string, timeStr: string): Date {
//   const [datePart] = dateStr.split("T");
//   const [time, modifier] = timeStr.split(" ");

//   const parts = time.split(":").map(Number);
//   let hours = parts[0] ?? 0;
//   const minutes = parts[1] ?? 0;

//   if (modifier === "PM" && hours !== 12) hours += 12;
//   if (modifier === "AM" && hours === 12) hours = 0;

//   const date = new Date(datePart);
//   date.setHours(hours, minutes, 0, 0);
//   return date;
// }

// export async function POST(req: Request) {
//   const body = await req.text();
//   const headersList = await headers();
//   const sig = headersList.get("Stripe-Signature") as string;

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
//   } catch (err: unknown) {
//     const message = err instanceof Error ? err.message : "Unknown error";
//     return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
//   }

//   const session = event.data.object as Stripe.Checkout.Session;

//   if (event.type === "checkout.session.completed") {
//     console.log(
//       `⚓ Webhook received: checkout.session.completed [${session.id}]`,
//     );

//     try {
//       // Return all necessary email payload data directly from the transaction
//       const emailPayload = await prisma.$transaction(async (tx) => {
//         const pendingEnrollment = await tx.pendingEnrollment.findUnique({
//           where: { stripeSessionId: session.id },
//         });

//         const email =
//           pendingEnrollment?.email ||
//           session.metadata?.billingEmail ||
//           session.customer_details?.email;
//         const name =
//           pendingEnrollment?.name ||
//           session.metadata?.billingName ||
//           session.customer_details?.name ||
//           "Learner Account";

//         if (!email) {
//           throw new Error(
//             "Critical context missing: No customer email found in database ledger or Stripe session details.",
//           );
//         }

//         const targetEducatorId =
//           pendingEnrollment?.educatorId || session.metadata?.educatorId;
//         const subject =
//           pendingEnrollment?.subject ||
//           session.metadata?.subject ||
//           "Tutoring Session";
//         const gradeLevel =
//           pendingEnrollment?.gradeLevel ||
//           session.metadata?.gradeLevel ||
//           "N/A";
//         const topic = pendingEnrollment?.topic || session.metadata?.topic || "";

//         let finalStartDate: Date;
//         let finalEndDate: Date;
//         let finalSessionDate: Date;

//         if (pendingEnrollment) {
//           finalStartDate = pendingEnrollment.startTime;
//           finalEndDate = pendingEnrollment.endTime;
//           finalSessionDate = pendingEnrollment.sessionDate;
//         } else if (
//           session.metadata?.sessionDate &&
//           session.metadata?.startTime &&
//           session.metadata?.endTime
//         ) {
//           finalStartDate = parseDateTime(
//             session.metadata.sessionDate,
//             session.metadata.startTime,
//           );
//           finalEndDate = parseDateTime(
//             session.metadata.sessionDate,
//             session.metadata.endTime,
//           );
//           finalSessionDate = new Date(session.metadata.sessionDate);
//         } else {
//           throw new Error(
//             "Unable to parse session timeline dates. Missing operational timeframe fields.",
//           );
//         }

//         let finalEducatorId = targetEducatorId || null;
//         if (finalEducatorId) {
//           const educatorExists = await tx.user.findUnique({
//             where: { id: finalEducatorId },
//           });
//           if (!educatorExists) {
//             console.warn(
//               `⚠️ Educator ${finalEducatorId} not found. Defaulting to system matching.`,
//             );
//             finalEducatorId = null;
//           }
//         }

//         if (!finalEducatorId) {
//           const fallbackEducator = await tx.user.findFirst({
//             where: { role: "Educator" },
//           });
//           if (!fallbackEducator) {
//             throw new Error(
//               "Transaction aborted: No valid educator found in the system to host this session.",
//             );
//           }
//           finalEducatorId = fallbackEducator.id;
//         }

//         const educator = await tx.user.findUnique({
//           where: { id: finalEducatorId },
//         });

//         let educatorEmail = "";
//         let educatorName = "Educator";
//         if (educator) {
//           educatorEmail = educator.email;
//           educatorName = educator.name || "Educator";
//         }

//         let user = await tx.user.findUnique({
//           where: { email: email },
//         });

//         if (!user) {
//           user = await tx.user.create({
//             data: {
//               email: email,
//               name: name,
//               stripeCustomerId: session.customer as string,
//               role: "Learner",
//             },
//           });
//         } else {
//           const updateData: Partial<
//             Pick<typeof user, "stripeCustomerId" | "role">
//           > = {};

//           if (!user.stripeCustomerId && session.customer) {
//             updateData.stripeCustomerId = session.customer as string;
//           }

//           if (user.role !== "Admin" && user.role !== "Educator") {
//             updateData.role = "Learner";
//           }

//           if (Object.keys(updateData).length > 0) {
//             user = await tx.user.update({
//               where: { id: user.id },
//               data: updateData,
//             });
//           }
//         }

//         await tx.transaction.create({
//           data: {
//             userId: user.id,
//             amount: session.amount_total ?? 0,
//             stripeSessionId: session.id,
//             status: "Paid",
//           },
//         });

//         await tx.appointment.create({
//           data: {
//             learnerId: user.id,
//             educatorId: finalEducatorId,
//             subject: subject,
//             gradeLevel: gradeLevel,
//             date: finalSessionDate,
//             startTime: finalStartDate,
//             endTime: finalEndDate,
//             learnerDescription: topic,
//             status: "Scheduled",
//             payoutStatus: "Unpaid",
//             stripeCheckoutSessionId: session.id,
//           },
//         });

//         if (pendingEnrollment) {
//           await tx.pendingEnrollment.update({
//             where: { id: pendingEnrollment.id },
//             data: { status: "Completed" },
//           });
//         }

//         // Return everything out of the transaction explicitly
//         return {
//           learnerEmail: user.email,
//           learnerName: user.name || "Learner",
//           educatorEmail,
//           educatorName,
//           appointmentDetails: {
//             subject,
//             date: finalSessionDate.toLocaleDateString("en-US", {
//               weekday: "long",
//               year: "numeric",
//               month: "long",
//               day: "numeric",
//             }),
//             startTime: finalStartDate.toLocaleTimeString("en-US", {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//             endTime: finalEndDate.toLocaleTimeString("en-US", {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//           },
//         };
//       });

//       // -------------------------------------------------------------
//       // 🚀 ASYNC EMAILS TRIGGER OUTSIDE TRANSACTION BLOCKS
//       // -------------------------------------------------------------
//       try {
//         const {
//           appointmentDetails: details,
//           learnerName,
//           learnerEmail,
//           educatorEmail,
//           educatorName,
//         } = emailPayload;

//         // 1. Send Email to Learner
//         const LearnerBookingConfirmedEmail = (
//           await import("@/app/_components/LearnerBookingConfirmedEmail")
//         ).default;

//         const learnerHtml = await render(
//           LearnerBookingConfirmedEmail({
//             username: learnerName,
//             subject: details.subject,
//             date: details.date,
//             time: `${details.startTime} - ${details.endTime}`,
//             amountPaid: session.amount_total
//               ? (session.amount_total / 100).toFixed(2)
//               : "0.00",
//           }),
//         );

//         await resend.emails.send({
//           from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
//           to: learnerEmail,
//           subject: "Appointment Confirmed & Payment Received!",
//           html: learnerHtml,
//         });

//         // 2. Send Email to Educator (if educator email is available)
//         if (educatorEmail) {
//           const EducatorSessionScheduledEmail = (
//             await import("@/app/_components/EducatorSessionScheduledEmail")
//           ).default;

//           const educatorHtml = await render(
//             EducatorSessionScheduledEmail({
//               educatorName: educatorName,
//               learnerName: learnerName,
//               subject: details.subject,
//               date: details.date,
//               time: `${details.startTime} - ${details.endTime}`,
//             }),
//           );

//           await resend.emails.send({
//             from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
//             to: educatorEmail,
//             subject: "New Student Session Scheduled",
//             html: educatorHtml,
//           });
//         }
//       } catch (emailErr) {
//         console.error(
//           "⚠️ Database write succeeded, but session emails failed to dispatch:",
//           emailErr,
//         );
//       }

//       return NextResponse.json({ received: true });
//     } catch (dbErr) {
//       console.error(
//         "❌ THE DATABASE TRANSACTION CRASHED WITH THIS ERROR:",
//         dbErr,
//       );
//       return new NextResponse(
//         `Database execution failed: ${dbErr instanceof Error ? dbErr.message : "Unknown structural error"}`,
//         { status: 500 },
//       );
//     }
//   }
// }
