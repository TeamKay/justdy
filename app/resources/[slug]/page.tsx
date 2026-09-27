import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ResourcePublicPreview from "./ResourcePublicPreview";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Image as ImageIcon,
  Layers3,
  Sparkles,
  Users,
} from "lucide-react";

import prisma from "@/lib/prisma";
import {
  ResourceStatus,
  ResourceVisibility,
} from "@/lib/generated/prisma/enums";

interface ResourcePageProps {
  params: Promise<{
    slug: string;
  }>;
}

type ResourceContent = {
  title?: string;
  description?: string;
  instructions?: string;
  questions?: unknown[];
  sections?: unknown[];
  pages?: unknown[];
};

function getContent(value: unknown): ResourceContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as ResourceContent;
}

function getTypeLabel(type: string) {
  return type
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getResourceIcon(type: string) {
  switch (type) {
    case "WORKSHEET":
    case "ASSIGNMENT":
    case "ASSESSMENT":
    case "QUESTION_BANK":
      return FileText;
    case "WORKBOOK":
    case "LESSON_PLAN":
    case "STUDY_GUIDE":
    case "READING":
      return BookOpen;
    case "PRESENTATION":
      return Layers3;
    case "IMAGE":
      return ImageIcon;
    default:
      return Sparkles;
  }
}

const RESOURCE_ICONS: Record<
  string,
  typeof FileText
> = {
  WORKSHEET: FileText,
  ASSIGNMENT: FileText,
  ASSESSMENT: FileText,
  QUESTION_BANK: FileText,
  WORKBOOK: BookOpen,
  LESSON_PLAN: BookOpen,
  STUDY_GUIDE: BookOpen,
  READING: BookOpen,
  PRESENTATION: Layers3,
  IMAGE: ImageIcon,
};

function countContentItems(content: ResourceContent) {
  if (Array.isArray(content.questions)) return content.questions.length;
  if (Array.isArray(content.sections)) return content.sections.length;
  if (Array.isArray(content.pages)) return content.pages.length;
  return null;
}

async function getPublishedResource(slug: string) {
  return prisma.resource.findFirst({
    where: {
      slug,
      status: ResourceStatus.PUBLISHED,
      visibility: ResourceVisibility.PUBLIC,
    },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      type: true,
      subject: true,
      topic: true,
      grade: true,
      difficulty: true,
      learningObjectives: true,
      standards: true,
      tags: true,
      keywords: true,
      thumbnailUrl: true,
      content: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function generateMetadata({
  params,
}: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getPublishedResource(slug);

  if (!resource) {
    return {
      title: "Resource | Justdy",
    };
  }

  const description =
    resource.description?.trim() ||
    `Explore this ${getTypeLabel(resource.type).toLowerCase()} on Justdy.`;

  return {
    title: `${resource.title} | Justdy`,
    description,
    openGraph: {
      title: resource.title,
      description,
      ...(resource.thumbnailUrl
        ? {
            images: [
              {
                url: resource.thumbnailUrl,
                alt: resource.title,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function PublicResourcePage({
  params,
}: ResourcePageProps) {
  const { slug } = await params;
  const resource = await getPublishedResource(slug);

  if (!resource) {
    notFound();
  }

  const content = getContent(resource.content);
  const ResourceIcon =
    RESOURCE_ICONS[resource.type] ?? Sparkles;
  const itemCount = countContentItems(content);

  const metadataItems = [
    resource.subject,
    resource.grade,
    resource.topic,
    resource.difficulty,
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-950"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-slate-950 text-white">
              J
            </span>
            Justdy
          </Link>

          <Link
            href="/create"
            className="hidden text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:block"
          >
            Create with AI
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 lg:pt-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600">
                <ResourceIcon className="size-3.5" />
                {getTypeLabel(resource.type)}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                Published
              </span>
            </div>

            <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              {resource.title}
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              {resource.description ||
                `A ${getTypeLabel(resource.type).toLowerCase()} created with Justdy.`}
            </p>

            {metadataItems.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2">
                {metadataItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-slate-500">
              {itemCount !== null && (
                <span className="flex items-center gap-2">
                  <FileText className="size-4" />
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}

              {resource.publishedAt && (
                <span className="flex items-center gap-2">
                  <Clock3 className="size-4" />
                  Published{" "}
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(resource.publishedAt)}
                </span>
              )}
            </div>

            <div className="mt-10">
              <ResourcePublicPreview type={resource.type} content={resource.content} />
            </div>

            <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Sparkles className="size-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    About this resource
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Open the resource to begin learning. Your activity can be
                    recorded as you work through the material.
                  </p>
                </div>
              </div>

              {Array.isArray(resource.learningObjectives) &&
                resource.learningObjectives.length > 0 && (
                  <div className="mt-7 border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Learning objectives
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {resource.learningObjectives
                        .slice(0, 8)
                        .map((objective, index) => (
                          <li
                            key={index}
                            className="flex gap-2 text-sm leading-6 text-slate-600"
                          >
                            <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" />
                            <span>
                              {typeof objective === "string"
                                ? objective
                                : JSON.stringify(objective)}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

              {resource.tags.length > 0 && (
                <div className="mt-7 border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Topics
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {resource.tags.slice(0, 12).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="lg:pt-14">
            <div className="sticky top-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {resource.thumbnailUrl ? (
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={resource.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-slate-100">
                  <div className="flex size-20 items-center justify-center rounded-3xl bg-white text-slate-700 shadow-sm">
                    <ResourceIcon className="size-9" />
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Ready to learn?
                </div>

                <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                  Start this resource
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Work through the material in Justdy and keep your learning
                  activity connected to the resource.
                </p>

                <Link
                  href={`/resources/${encodeURIComponent(resource.slug)}/learn`}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Use Resource
                  <ArrowRight className="size-4" />
                </Link>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <Users className="size-4 text-slate-500" />
                    <div className="mt-2 text-xs font-medium text-slate-500">
                      Learning
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      Guided use
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <CheckCircle2 className="size-4 text-slate-500" />
                    <div className="mt-2 text-xs font-medium text-slate-500">
                      Status
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      Public
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
