import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/app/_components/ui/card";
import { buttonVariants } from "@/app/_components/ui/button";
import { EditCourseForm } from "@/app/_components/EditCourseForm";
import { SubmitForReviewButton } from "@/app/_components/SubmitForReviewButton";
import { EditDigitalProduct } from "@/app/_components/EditDigitalProduct";
import CourseStructure from "@/app/_components/CourseStructure";

type Params = Promise<{ productId: string }>;

export default async function EditProduct({ params }: { params: Params }) {
  const { productId } = await params;

  // 1. Authenticate user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 2. Fetch Product with both Course and DigitalProduct + Images relations
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
      userId: session.user.id, // Ensures ownership
    },
    include: {
      course: {
        include: {
          chapter: {
            include: {
              lessons: true,
            },
          },
        },
      },
      digitalProduct: {
        include: {
          images: {
            orderBy: {
              position: "asc", // Keeps gallery images ordered by position
            },
          },
        },
      },
    },
  });

  // 3. Handle non-existent or unauthorized access
  if (!product) {
    notFound();
  }

  const isCourse = product.type === "Course";
  const hasCourseRelation = Boolean(product.course);

  // 4. Flatten and sanitize course data

  // 4. Safely extract file keys from available relations
  // Checks course.imageKey first, then digitalProduct.fileKey
  const rawFileKey =
    product.course?.imageKey ?? product.digitalProduct?.fileKey ?? "";

  // Build a valid URL from rawFileKey if present
  const rawImageUrl = rawFileKey ? `https://utfs.io/f/${rawFileKey}` : "";

  const courseFormData = {
    id: product.id,
    title: product.title ?? "",
    type: product.type,
    slug: product.slug ?? "",
    smallDescription: product.smallDescription ?? "",
    description: product.description ?? "",
    price: product.price ?? 0,
    status: product.status,
    fileKey: rawFileKey.trim(),
    imageUrl: rawImageUrl.trim(),
    duration: product.course?.duration ?? 0,
    category: product.course?.category ?? "",
    hasCourseRelation,
    chapter: product.course?.chapter || [],
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-0 md:pt-5 md:pb-5 space-y-4">
      {/* Universal Sticky/Top Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/10">
        <div className="flex items-center gap-3">
          <Link
            href="/educator/products"
            className={buttonVariants({ variant: "secondary", size: "icon" })}
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Edit Product: <span className="text-primary">{product.title}</span>
          </h1>
        </div>

        {/* Only display Review action helper if Course schema elements actually exist */}
        {hasCourseRelation && (
          <div className="flex items-center gap-2">
            <SubmitForReviewButton
              id={productId}
              status={product.status}
              chapters={product.course?.chapter || []}
            />
          </div>
        )}
      </div>

      {isCourse ? (
        /* ================= COURSE LAYOUT ================= */
        <Tabs defaultValue="basic-info" className="w-full">
          <TabsList className="bg-transparent h-auto p-0 justify-start border-b border-zinc-200/10 w-full rounded-none mb-6 gap-6">
            <TabsTrigger
              value="basic-info"
              className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
            >
              Basic Information
            </TabsTrigger>
            <TabsTrigger
              value="course-structure"
              className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
            >
              Course Structure
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="basic-info"
            className="mt-0 focus-visible:outline-none"
          >
            <Card className="border-zinc-200/10 shadow-sm rounded-xl">
              <CardContent className="pt-0">
                <EditCourseForm data={courseFormData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="course-structure"
            className="mt-0 focus-visible:outline-none"
          >
            <Card className="border-zinc-200/10 shadow-sm rounded-xl">
              <CardHeader>
                <CardDescription>
                  Organize your curriculum into chapters and lessons.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CourseStructure data={courseFormData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* ================= DIGITAL PRODUCT LAYOUT ================= */
        <Card className="border-zinc-200/10 shadow-sm rounded-xl">
          <CardHeader></CardHeader>
          <CardContent>
            <EditDigitalProduct data={product} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// import { notFound, redirect } from "next/navigation";
// import Link from "next/link";
// import { ArrowLeft } from "lucide-react";
// import prisma from "@/lib/prisma";
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";

// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@/app/_components/ui/tabs";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
// } from "@/app/_components/ui/card";
// import { buttonVariants } from "@/app/_components/ui/button";
// import { EditCourseForm } from "@/app/_components/EditCourseForm";
// import { SubmitForReviewButton } from "@/app/_components/SubmitForReviewButton";
// import { EditDigitalProduct } from "@/app/_components/EditDigitalProduct";
// import CourseStructure from "@/app/_components/CourseStructure";

// type Params = Promise<{ productId: string }>;

// export default async function EditProduct({ params }: { params: Params }) {
//   const { productId } = await params;

//   // 1. Authenticate user
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });

//   if (!session?.user?.id) {
//     redirect("/login");
//   }

//   // 2. Fetch Product with both Course and DigitalProduct + Images relations
//   const product = await prisma.product.findUnique({
//     where: {
//       id: productId,
//       userId: session.user.id, // Ensures ownership
//     },
//     include: {
//       course: {
//         include: {
//           chapter: {
//             include: {
//               lessons: true,
//             },
//           },
//         },
//       },
//       digitalProduct: {
//         include: {
//           images: {
//             orderBy: {
//               position: "asc", // Keeps gallery images ordered by position
//             },
//           },
//         },
//       },
//     },
//   });

//   // 3. Handle non-existent or unauthorized access
//   if (!product) {
//     notFound();
//   }

//   const isCourse = product.type === "Course";
//   const hasCourseRelation = Boolean(product.course);

//   // 4. Flatten the course structure so it matches EditCourseForm & CourseStructure expectations
//   const courseFormData = {
//     id: product.id,
//     title: product.title,
//     slug: product.slug,
//     smallDescription: product.smallDescription,
//     description: product.description,
//     price: product.price,
//     status: product.status,
//     fileKey: product.digitalProduct?.fileKey ?? "",
//     imageUrl: product.course?.imageKey ?? "",
//     duration: product.course?.duration ?? null,
//     category: product.course?.category ?? "",
//     hasCourseRelation,
//     chapter: product.course?.chapter || [],
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-4 md:p-5 space-y-8">
//       {/* Universal Sticky/Top Navigation Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/10">
//         <div className="flex items-center gap-3">
//           <Link
//             href="/educator/products"
//             className={buttonVariants({ variant: "secondary", size: "icon" })}
//           >
//             <ArrowLeft className="size-5" />
//           </Link>
//           <h1 className="text-3xl font-extrabold tracking-tight">
//             Edit Product: <span className="text-primary">{product.title}</span>
//           </h1>
//         </div>

//         {/* Only display Review action helper if Course schema elements actually exist */}
//         {hasCourseRelation && (
//           <div className="flex items-center gap-2">
//             <SubmitForReviewButton
//               id={productId}
//               status={product.status}
//               chapters={product.course?.chapter || []}
//             />
//           </div>
//         )}
//       </div>

//       {isCourse ? (
//         /* ================= COURSE LAYOUT ================= */
//         <Tabs defaultValue="basic-info" className="w-full">
//           <TabsList className="bg-transparent h-auto p-0 justify-start border-b border-zinc-200/10 w-full rounded-none mb-6 gap-6">
//             <TabsTrigger
//               value="basic-info"
//               className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
//             >
//               Basic Information
//             </TabsTrigger>
//             <TabsTrigger
//               value="course-structure"
//               className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
//             >
//               Course Structure
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent
//             value="basic-info"
//             className="mt-0 focus-visible:outline-none"
//           >
//             <Card className="border-zinc-200/10 shadow-sm rounded-xl">
//               <CardContent className="pt-6">
//                 <EditCourseForm data={courseFormData} />
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent
//             value="course-structure"
//             className="mt-0 focus-visible:outline-none"
//           >
//             <Card className="border-zinc-200/10 shadow-sm rounded-xl">
//               <CardHeader>
//                 <CardDescription>
//                   Organize your curriculum into chapters and lessons.
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <CourseStructure data={courseFormData} />
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       ) : (
//         /* ================= DIGITAL PRODUCT LAYOUT ================= */
//         <Card className="border-zinc-200/10 shadow-sm rounded-xl">
//           <CardHeader></CardHeader>
//           <CardContent>
//             <EditDigitalProduct data={product} />
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }

// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@/app/_components/ui/tabs";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
// } from "@/app/_components/ui/card";
// import { educatorGetCourse } from "@/app/actions/educator-get-course";
// import { ArrowLeft } from "lucide-react";
// import { buttonVariants } from "@/app/_components/ui/button";
// import Link from "next/link";
// import { EditCourseForm } from "@/app/_components/EditCourseForm";
// import { SubmitForReviewButton } from "@/app/_components/SubmitForReviewButton";
// import { EditDigitalProduct } from "@/app/_components/EditDigitalProduct";
// import CourseStructure from "@/app/_components/CourseStructure";

// type Params = Promise<{ productId: string }>;

// export default async function EditProduct({ params }: { params: Params }) {
//   const { productId } = await params;
//   const data = await educatorGetCourse(productId);

//   // Check if the product type is a Course
//   // Note: Adjust the string "Course" if your Prisma enum uses a different casing (e.g. "COURSE")
//   const isCourse = data.type === "Course";

//   return (
//     <div className="max-w-6xl mx-auto p-4 md:p-5 space-y-8">
//       {/* Universal Sticky/Top Navigation Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/10">
//         <div className="flex items-center gap-3">
//           <Link
//             href="/educator/products"
//             className={buttonVariants({ variant: "secondary", size: "icon" })}
//           >
//             <ArrowLeft className="size-5" />
//           </Link>
//           <h1 className="text-3xl font-extrabold tracking-tight">
//             Edit Product: <span className="text-primary">{data.title}</span>
//           </h1>
//         </div>

//         {/* Only display Review action helper if Course schema elements actually exist */}
//         {data.hasCourseRelation && (
//           <div className="flex items-center gap-2">
//             <SubmitForReviewButton
//               id={productId}
//               status={data.status}
//               chapters={data.chapter}
//             />
//           </div>
//         )}
//       </div>

//       {isCourse ? (
//         /* ================= COURSE LAYOUT ================= */
//         <Tabs defaultValue="basic-info" className="w-full">
//           <TabsList className="bg-transparent h-auto p-0 justify-start border-b border-zinc-200/10 w-full rounded-none mb-6 gap-6">
//             <TabsTrigger
//               value="basic-info"
//               className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
//             >
//               Basic Information
//             </TabsTrigger>
//             <TabsTrigger
//               value="course-structure"
//               className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
//             >
//               Course Structure
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent
//             value="basic-info"
//             className="mt-0 focus-visible:outline-none"
//           >
//             <Card className="border-zinc-200/10 shadow-sm rounded-xl">
//               <CardContent className="pt-6">
//                 <EditCourseForm data={data} />
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent
//             value="course-structure"
//             className="mt-0 focus-visible:outline-none"
//           >
//             <Card className="border-zinc-200/10 shadow-sm rounded-xl">
//               <CardHeader>
//                 <CardDescription>
//                   Organize your curriculum into chapters and lessons.
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <CourseStructure data={data} />
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       ) : (
//         /* ================= DIGITAL PRODUCT LAYOUT ================= */
//         <Card className="border-zinc-200/10 shadow-sm rounded-xl">
//           <CardHeader></CardHeader>
//           <CardContent>
//             <EditDigitalProduct data={data} />
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }

// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@/app/_components/ui/tabs";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import { educatorGetCourse } from "@/app/actions/educator-get-course";
// import ProductStructure from "@/app/_components/CourseStructure";
// import { ArrowLeft } from "lucide-react";
// import { buttonVariants } from "@/app/_components/ui/button";
// import Link from "next/link";
// import { EditCourseForm } from "@/app/_components/EditCourseForm";
// import { SubmitForReviewButton } from "@/app/_components/SubmitForReviewButton";
// import { EditDigitalProduct } from "@/app/_components/EditDigitalProduct";

// type Params = Promise<{ id: string }>;

// export default async function EditProduct({ params }: { params: Params }) {
//   const { id } = await params;
//   const data = await educatorGetCourse(id);

//   return (
//     <div className="max-w-6xl mx-auto p-4 md:p-5 space-y-8">
//       {/* Universal Sticky/Top Navigation Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/10">
//         <div className="flex items-center gap-3">
//           <Link
//             href="/educator/products"
//             className={buttonVariants({ variant: "secondary", size: "icon" })}
//           >
//             <ArrowLeft className="size-5" />
//           </Link>
//           <h1 className="text-3xl font-extrabold tracking-tight">
//             Edit Product: <span className="text-primary">{data.title}</span>
//           </h1>
//         </div>

//         {/* Only display Review action helper if Course schema elements actually exist */}
//         {data.hasCourseRelation && (
//           <div className="flex items-center gap-2">
//             <SubmitForReviewButton
//               id={id}
//               status={data.status}
//               chapters={data.chapter}
//             />
//           </div>
//         )}
//       </div>

//       <Tabs defaultValue="basic-info" className="w-full">
//         <TabsList className="bg-transparent h-auto p-0 justify-start border-b border-zinc-200/10 w-full rounded-none mb-6 gap-6">
//           <TabsTrigger
//             value="basic-info"
//             className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
//           >
//             Basic Information
//           </TabsTrigger>
//           <TabsTrigger
//             value="course-structure"
//             className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
//           >
//             Course Structure
//           </TabsTrigger>

//           <TabsTrigger
//             value="digital-product"
//             className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
//           >
//             Digital Product
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent
//           value="basic-info"
//           className="mt-0 focus-visible:outline-none"
//         >
//           <Card className="border-zinc-200/10 shadow-sm rounded-xl">
//             <CardContent className="pt-6">
//               <EditCourseForm data={data} />
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent
//           value="course-structure"
//           className="mt-0 focus-visible:outline-none"
//         >
//           <Card className="border-zinc-200/80 shadow-sm rounded-xl">
//             <CardHeader>
//               <CardTitle>Course Structure</CardTitle>
//               <CardDescription>
//                 Organize your curriculum into sections and lessons.
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ProductStructure data={data} />
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent
//           value="digital-product"
//           className="mt-0 focus-visible:outline-none"
//         >
//           <Card className="border-zinc-200/80 shadow-sm rounded-xl">
//             <CardHeader>
//               <CardTitle>Course Structure</CardTitle>
//               <CardDescription>
//                 Organize your curriculum into sections and lessons.
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <EditDigitalProduct data={data} />
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }

// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@/app/_components/ui/tabs";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import { educatorGetCourse } from "@/app/actions/educator-get-course";
// import ProductStructure from "@/app/_components/CourseStructure";
// import { ArrowLeft } from "lucide-react";
// import { buttonVariants } from "@/app/_components/ui/button"; // Ensure path matches your ui button
// import Link from "next/link";
// import { EditCourseForm } from "@/app/_components/EditCourseForm";
// import { SubmitForReviewButton } from "@/app/_components/SubmitForReviewButton";

// type Params = Promise<{ id: string }>;

// export default async function EditProduct({ params }: { params: Params }) {
//   const { id } = await params;
//   const data = await educatorGetCourse(id);

//   return (
//     <div className="max-w-6xl mx-auto p-4 md:p-5 space-y-8">
//       {/* Universal Sticky/Top Navigation Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/10">
//         <div className="flex items-center gap-3">
//           <Link
//             href="/educator/products"
//             className={buttonVariants({ variant: "secondary", size: "icon" })}
//           >
//             <ArrowLeft className="size-5" />
//           </Link>
//           <h1 className="text-3xl font-extrabold tracking-tight">
//             Edit Product: <span className="text-primary">{data.title}</span>
//           </h1>
//         </div>

//         {/* Global Review Trigger placement */}
//         <div className="flex items-center gap-2">
//           <SubmitForReviewButton
//             id={id}
//             status={data.status}
//             chapters={data.chapter}
//           />
//         </div>
//       </div>

//       <Tabs defaultValue="basic-info" className="w-full">
//         <TabsList className="bg-transparent h-auto p-0 justify-start border-b border-zinc-200/10 w-full rounded-none mb-6 gap-6">
//           <TabsTrigger
//             value="basic-info"
//             className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
//           >
//             Basic Information
//           </TabsTrigger>
//           <TabsTrigger
//             value="course-structure"
//             className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
//           >
//             Course Structure
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent
//           value="basic-info"
//           className="mt-0 focus-visible:outline-none"
//         >
//           <Card className="border-zinc-200/10 shadow-sm rounded-xl">
//             <CardContent className="pt-6">
//               <EditCourseForm data={data} />
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent
//           value="course-structure"
//           className="mt-0 focus-visible:outline-none"
//         >
//           <Card className="border-zinc-200/80 shadow-sm rounded-xl">
//             <CardHeader>
//               <CardTitle>Course Structure</CardTitle>
//               <CardDescription>
//                 Organize your curriculum into sections and lessons.
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ProductStructure data={data} />
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }

// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@/app/_components/ui/tabs";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import { educatorGetProduct } from "@/app/actions/educator-get-product";

// import ProductStructure from "@/app/_components/CourseStructure";

// import { ArrowLeft } from "lucide-react";
// import { buttonVariants } from "@/components/ui/button";
// import Link from "next/link";
// import { EditCourseForm } from "@/app/_components/EditCourseForm";

// type Params = Promise<{ productId: string }>;

// export default async function EditRoute({ params }: { params: Params }) {
//   const { productId } = await params;
//   const data = await educatorGetProduct(productId);

//   // Check if product is a course (adjust casing/value if your DB uses "COURSE" or an ID)
//   const isCourse = data.category?.toLowerCase() === "course";

//   return (
//     <div className="max-w-6xl mx-auto p-4 md:p-5 space-y-8">
//       <div className="space-y-2 mb-8">
//         {/* Horizontal group for Back Button and Heading */}
//         <div className="flex items-center gap-3">
//           <Link
//             href="/educator/products"
//             className={buttonVariants({ variant: "secondary", size: "icon" })}
//           >
//             <ArrowLeft className="size-5" />
//           </Link>
//           <h1 className="text-3xl font-extrabold tracking-tight">
//             Edit Product: <span className="text-primary">{data.title}</span>
//           </h1>
//         </div>
//       </div>

//       {isCourse ? (
//         /* --- COURSE VIEW --- */
//         <Tabs defaultValue="basic-info" className="w-full">
//           {/* Professional borderless underline-style tabs sub-navigation */}
//           <TabsList className="bg-transparent h-auto p-0 justify-start border-b border-zinc-200/10 w-full rounded-none mb-6 gap-6">
//             <TabsTrigger
//               value="basic-info"
//               className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
//             >
//               Basic Information
//             </TabsTrigger>
//             <TabsTrigger
//               value="course-structure"
//               className="data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-sm transition-all bg-transparent shadow-none data-[state=active]:shadow-none"
//             >
//               Course Structure
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent
//             value="basic-info"
//             className="mt-0 focus-visible:outline-none"
//           >
//             <Card className="border-zinc-200/10 shadow-sm rounded-xl">
//               <CardContent className="pt-0">
//                 <EditCourseForm data={data} />
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent
//             value="course-structure"
//             className="mt-0 focus-visible:outline-none"
//           >
//             <Card className="border-zinc-200/80 shadow-sm rounded-xl">
//               <CardHeader>
//                 <CardTitle>Course Structure</CardTitle>
//                 <CardDescription>
//                   Organize your curriculum into sections and lessons.
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <ProductStructure data={data} />
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       ) : (
//         /* --- DIGITAL PRODUCT VIEW --- */
//         <div>{/* <EditDigitalProductPage /> */}</div>
//       )}
//     </div>
//   );
// }

// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@/app/_components/ui/tabs";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import { educatorGetProduct } from "@/app/actions/educator-get-product";
// import { EditProductForm } from "@/app/_components/EditProductForm";
// import ProductStructure from "@/app/_components/CourseStructure";

// type Params = Promise<{ productId: string }>;

// export default async function EditRoute({ params }: { params: Params }) {
//   const { productId } = await params;
//   const data = await educatorGetProduct(productId);

//   return (
//     /* Added responsive padding and a max-width container for a professional look */
//     <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
//       <header className="space-y-2">
//         <h1 className="text-3xl font-extrabold tracking-tight">
//           Edit Product: <span className="text-primary">{data.title}</span>
//         </h1>
//         <p className="text-muted-foreground">
//           Manage your product details, curriculum, and settings from one place.
//         </p>
//       </header>

//       <Tabs defaultValue="basic-info" className="w-full">
//         {/* Modernized TabList with better spacing */}
//         <TabsList className="inline-flex h-11 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full sm:w-auto mb-4">
//           <TabsTrigger value="basic-info" className="px-8">
//             Basic Info
//           </TabsTrigger>
//           <TabsTrigger value="course-structure" className="px-8">
//             Product (Course) Structure
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="basic-info" className="mt-0">
//           <Card className="shadow-sm border-zinc-200">
//             <CardHeader>
//               <CardTitle>General Information</CardTitle>
//               <CardDescription>
//                 Update the title, description, and thumbnail of your product.
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="pt-0">
//               <EditProductForm data={data} />
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="course-structure" className="mt-0">
//           <Card className="shadow-sm border-zinc-200">
//             <CardHeader>
//               <CardTitle>Product (Course) Structure</CardTitle>
//               <CardDescription>
//                 Organize your curriculum into sections and lessons.
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ProductStructure data={data} />
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }
