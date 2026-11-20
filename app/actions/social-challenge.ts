
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function joinSocialChallenge(challengeId: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Please sign in to join this challenge.",
    };
  }

  if (
    typeof challengeId !== "string" ||
    !challengeId.trim() ||
    challengeId.length > 100
  ) {
    return {
      success: false as const,
      error: "Invalid mathematics challenge.",
    };
  }

  const normalizedChallengeId = challengeId.trim();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify that the signed-in user is an eligible learner.
      const learner = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          role: true,
          status: true,
          socialProfile: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (!learner || learner.status !== "Active") {
        throw new Error("Your account is not active.");
      }

      if (learner.role !== "LEARNER") {
        throw new Error(
          "Only learner accounts can join mathematics challenges.",
        );
      }

      if (
        !learner.socialProfile ||
        learner.socialProfile.status !== "ACTIVE"
      ) {
        throw new Error(
          "You need an active social profile to join this challenge.",
        );
      }

      // 2. Retrieve and validate the challenge.
      const challenge = await tx.socialChallenge.findUnique({
        where: { id: normalizedChallengeId },
        select: {
          id: true,
          opensAt: true,
          closesAt: true,
          status: true,
          post: {
            select: {
              id: true,
              status: true,
              visibility: true,
              postType: true,
              author: {
                select: {
                  id: true,
                  status: true,
                  socialProfile: {
                    select: {
                      username: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (
        !challenge ||
        challenge.post.status !== "PUBLISHED" ||
        challenge.post.visibility !== "PUBLIC" ||
        challenge.post.postType !== "CHALLENGE" ||
        challenge.post.author.status !== "Active" ||
        challenge.post.author.socialProfile?.status !== "ACTIVE" ||
        challenge.post.author.socialProfile.username !==
          "justdy_official"
      ) {
        throw new Error("This mathematics challenge is unavailable.");
      }

      // 3. Enforce the challenge participation period.
      const now = new Date();

      if (challenge.status !== "OPEN") {
        throw new Error(
          "This challenge is not accepting participants.",
        );
      }

      if (now < challenge.opensAt) {
        throw new Error("This challenge has not opened yet.");
      }

      if (now >= challenge.closesAt) {
  throw new Error(
    "The submission deadline for this challenge has passed. Answers can no longer be submitted or updated.",
  );
}

      // 4. Check whether this learner has already joined.
      const existingParticipant =
        await tx.socialChallengeParticipant.findUnique({
          where: {
            challengeId_userId: {
              challengeId: challenge.id,
              userId: learner.id,
            },
          },
          select: {
            id: true,
          },
        });

      // 5. Register the learner.
      // The upsert and database unique constraint prevent duplicate
      // participation records.
      await tx.socialChallengeParticipant.upsert({
        where: {
          challengeId_userId: {
            challengeId: challenge.id,
            userId: learner.id,
          },
        },
        create: {
          challengeId: challenge.id,
          userId: learner.id,
        },
        update: {},
        select: {
          id: true,
        },
      });

      // 6. Get the updated number of participants.
      const participantCount =
        await tx.socialChallengeParticipant.count({
          where: {
            challengeId: challenge.id,
          },
        });

      return {
        alreadyJoined: Boolean(existingParticipant),
        participantCount,
      };
    });

    // 7. Refresh the pages displaying the challenge.
    revalidatePath("/");
    revalidatePath("/home");

    return {
      success: true as const,
      alreadyJoined: result.alreadyJoined,
      participantCount: result.participantCount,
    };
  } catch (error) {
    console.error("Join mathematics challenge error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to join this challenge. Please try again.",
    };
  }
}

export async function submitSocialChallengeAnswer(
  challengeId: unknown,
  answer: unknown,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Please sign in to submit your answer.",
    };
  }

  if (
    typeof challengeId !== "string" ||
    !challengeId.trim() ||
    challengeId.length > 100
  ) {
    return {
      success: false as const,
      error: "Invalid mathematics challenge.",
    };
  }

  if (typeof answer !== "string") {
    return {
      success: false as const,
      error: "Please enter your answer.",
    };
  }

  const normalizedAnswer = answer.trim();

  if (!normalizedAnswer) {
    return {
      success: false as const,
      error: "Your answer cannot be empty.",
    };
  }

  if (normalizedAnswer.length > 20000) {
    return {
      success: false as const,
      error: "Your answer cannot exceed 20,000 characters.",
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify learner eligibility.
      const learner = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          role: true,
          status: true,
          socialProfile: {
            select: {
              status: true,
            },
          },
        },
      });

      if (!learner || learner.status !== "Active") {
        throw new Error("Your account is not active.");
      }

      if (learner.role !== "LEARNER") {
        throw new Error(
          "Only learner accounts can submit challenge answers.",
        );
      }

      if (learner.socialProfile?.status !== "ACTIVE") {
        throw new Error(
          "You need an active social profile to submit an answer.",
        );
      }

      // 2. Retrieve and validate the challenge.
      const challenge = await tx.socialChallenge.findUnique({
        where: {
          id: challengeId.trim(),
        },
        select: {
          id: true,
          opensAt: true,
          closesAt: true,
          status: true,
          post: {
            select: {
              status: true,
              visibility: true,
              postType: true,
              author: {
                select: {
                  status: true,
                  socialProfile: {
                    select: {
                      username: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (
        !challenge ||
        challenge.post.status !== "PUBLISHED" ||
        challenge.post.visibility !== "PUBLIC" ||
        challenge.post.postType !== "CHALLENGE" ||
        challenge.post.author.status !== "Active" ||
        challenge.post.author.socialProfile?.status !== "ACTIVE" ||
        challenge.post.author.socialProfile.username !==
          "justdy_official"
      ) {
        throw new Error("This mathematics challenge is unavailable.");
      }

      // 3. Enforce the submission period.
      const now = new Date();

      if (challenge.status !== "OPEN") {
        throw new Error(
          "This challenge is not accepting submissions.",
        );
      }

      if (now < challenge.opensAt) {
        throw new Error("This challenge has not opened yet.");
      }

     if (now >= challenge.closesAt) {
  throw new Error(
    "The submission deadline for this challenge has passed.",
  );
}

      // 4. Confirm that the learner has registered.
      const participation =
        await tx.socialChallengeParticipant.findUnique({
          where: {
            challengeId_userId: {
              challengeId: challenge.id,
              userId: learner.id,
            },
          },
          select: {
            id: true,
          },
        });

      if (!participation) {
        throw new Error(
          "You must join this challenge before submitting an answer.",
        );
      }

      // 5. Save the answer.
      // The unique constraint guarantees one submission per learner.
      const submission =
        await tx.socialChallengeSubmission.upsert({
          where: {
            challengeId_userId: {
              challengeId: challenge.id,
              userId: learner.id,
            },
          },
          create: {
            challengeId: challenge.id,
            userId: learner.id,
            answer: normalizedAnswer,
            status: "PENDING",
          },
          update: {
            answer: normalizedAnswer,
            status: "PENDING",
            score: null,
            feedback: null,
            gradedById: null,
            gradedAt: null,
            submittedAt: now,
          },
          select: {
            id: true,
            status: true,
            submittedAt: true,
          },
        });

      return submission;
    });

    revalidatePath("/");
    revalidatePath("/home");

    return {
      success: true as const,
      submission: {
        id: result.id,
        status: result.status,
        submittedAt: result.submittedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Submit mathematics challenge answer error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to submit your answer. Please try again.",
    };
  }
}


export async function gradeSocialChallengeSubmission(
  submissionId: unknown,
  score: unknown,
  feedback: unknown,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false as const,
      error: "Please sign in to grade challenge submissions.",
    };
  }

  if (
    typeof submissionId !== "string" ||
    !submissionId.trim() ||
    submissionId.length > 100
  ) {
    return {
      success: false as const,
      error: "Invalid challenge submission.",
    };
  }

  if (
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score < 0
  ) {
    return {
      success: false as const,
      error: "Enter a valid whole-number score.",
    };
  }

  if (
    feedback !== undefined &&
    feedback !== null &&
    typeof feedback !== "string"
  ) {
    return {
      success: false as const,
      error: "Invalid grading feedback.",
    };
  }

  const normalizedFeedback =
    typeof feedback === "string" ? feedback.trim() : "";

  if (normalizedFeedback.length > 5000) {
    return {
      success: false as const,
      error: "Feedback cannot exceed 5,000 characters.",
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verify the administrator against the database.
      const administrator = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          role: true,
          status: true,
        },
      });

      if (
        !administrator ||
        administrator.role !== "ADMIN" ||
        administrator.status !== "Active"
      ) {
        throw new Error("You are not authorized to grade submissions.");
      }

      // Load the submission and verify its challenge is an official challenge.
      const submission =
        await tx.socialChallengeSubmission.findUnique({
          where: { id: submissionId.trim() },
          select: {
            id: true,
            challenge: {
              select: {
                id: true,
                maxScore: true,
                post: {
                  select: {
                    postType: true,
                    status: true,
                    visibility: true,
                    author: {
                      select: {
                        status: true,
                        socialProfile: {
                          select: {
                            username: true,
                            status: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

      if (!submission) {
        throw new Error("The challenge submission could not be found.");
      }

      const challenge = submission.challenge;
      const post = challenge.post;

      if (
        post.postType !== "CHALLENGE" ||
        post.status !== "PUBLISHED" ||
        post.visibility !== "PUBLIC" ||
        post.author.status !== "Active" ||
        post.author.socialProfile?.username !== "justdy_official" ||
        post.author.socialProfile.status !== "ACTIVE"
      ) {
        throw new Error("This is not an active official challenge.");
      }

      if (score > challenge.maxScore) {
        throw new Error(
          `The maximum score for this challenge is ${challenge.maxScore}.`,
        );
      }

      const gradedAt = new Date();

      return tx.socialChallengeSubmission.update({
        where: { id: submission.id },
        data: {
          status: "GRADED",
          score,
          feedback: normalizedFeedback || null,
          gradedById: administrator.id,
          gradedAt,
        },
        select: {
          id: true,
          status: true,
          score: true,
          feedback: true,
          gradedAt: true,
        },
      });
    });

    revalidatePath("/admin/challenge-submissions");
    revalidatePath("/");
    revalidatePath("/home");

    return {
      success: true as const,
      submission: {
        id: result.id,
        status: result.status,
        score: result.score,
        feedback: result.feedback,
        gradedAt: result.gradedAt?.toISOString() ?? null,
      },
    };
  } catch (error) {
    console.error("Grade mathematics challenge submission error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save the grade. Please try again.",
    };
  }
}
