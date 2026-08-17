"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import { useForm, useWatch, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Loader2,
  SlidersHorizontal,
  DollarSign,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

import {
  productSchema,
  ProductSchemaType,
  productType,
} from "@/lib/zodSchemas";
import { tryCatch } from "@/hooks/try-catch";
import { CreateProduct } from "@/app/actions/manager-create-product";

import { Button, buttonVariants } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";

export default function ProductCreation() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const form = useForm<ProductSchemaType>({
    resolver: zodResolver(productSchema) as Resolver<ProductSchemaType>,

    defaultValues: {
      title: "",
      description: "",
      price: 0,
      printedPrice: undefined,
      type: "Course",
      status: "Draft",
      slug: "",
    },
  });

  // ============================================================
  // WATCH FORM VALUES
  // ============================================================

  const slug = useWatch({
    control: form.control,
    name: "slug",
  });

  const selectedType = useWatch({
    control: form.control,
    name: "type",
  });

  const currentPrice = useWatch({
    control: form.control,
    name: "price",
  });

  const currentPrintedPrice = useWatch({
    control: form.control,
    name: "printedPrice",
  });

  // Courses do not have printed versions.
  const isDigitalProduct = selectedType !== "Course";

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleProcess(values: ProductSchemaType) {
    setIsSubmitting(true);

    try {
      const submissionData: ProductSchemaType = {
        ...values,

        // Always save new products as Draft.
        status: "Draft",

        // Courses should never have a printed price.
        printedPrice:
          values.type === "Course" ? undefined : values.printedPrice,
      };

      const { data: result, error } = await tryCatch(
        CreateProduct(submissionData),
      );

      if (error) {
        toast.error("An unexpected error occurred.");
        return;
      }

      if (result.status === "success") {
        toast.success("Product saved successfully!");

        form.reset();

        router.push("/manage/products");
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Product creation error:", error);

      toast.error("Something went wrong processing your submission.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleProcess)}
        className="max-w-6xl w-full mx-auto px-0 py-8 lg:py-5 space-y-5"
      >
        {/* ============================================================
            TOP CONTROL BAR
        ============================================================ */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
          <div className="flex items-center gap-4">
            <Link
              href="/manage/products"
              className={buttonVariants({
                variant: "ghost",
                size: "icon",
              })}
            >
              <ArrowLeft className="size-5 text-muted-foreground hover:text-foreground transition-colors" />
            </Link>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Create a new product
              </h1>

              <p className="text-sm text-muted-foreground mt-1">
                Add your product information, pricing and settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <Link
              href="/manage/products"
              className={buttonVariants({
                variant: "ghost",
              })}
            >
              Cancel
            </Link>

            <Button type="submit" disabled={isSubmitting} className="min-w-32">
              {isSubmitting && <Loader2 className="animate-spin mr-2 size-4" />}

              {isSubmitting ? "Saving..." : "Save Draft"}
            </Button>
          </div>
        </div>

        {/* ============================================================
            CONTENT LAYOUT
        ============================================================ */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ============================================================
              MAIN EDITING COLUMN
          ============================================================ */}

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
              <CardContent className="space-y-6">
                {/* PRODUCT TITLE */}

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Product Name
                      </FormLabel>

                      <FormControl>
                        <Input
                          className="h-11 shadow-sm focus-visible:ring-primary"
                          placeholder="e.g., Advanced TypeScript Masterclass"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);

                            form.setValue(
                              "slug",
                              slugify(e.target.value, {
                                lower: true,
                                strict: true,
                              }),
                            );
                          }}
                        />
                      </FormControl>

                      {slug && (
                        <p className="text-xs text-muted-foreground mt-1.5 px-1 truncate hidden">
                          URL Preview:{" "}
                          <span className="text-primary font-mono select-all">
                            /products/{slug}
                          </span>
                        </p>
                      )}

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* DESCRIPTION */}

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Full Description
                      </FormLabel>

                      <FormControl>
                        <div className="min-h-75 border border-input rounded-lg overflow-hidden bg-background focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm">
                          <RichTextEditor field={field} />
                        </div>
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* ============================================================
              SIDEBAR
          ============================================================ */}

          <div className="space-y-6 lg:sticky lg:top-6">
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-primary" />
                  Logistics & Settings
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* ======================================================
                    PRODUCT TYPE
                ====================================================== */}

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-medium mb-1">
                        Product Type
                      </FormLabel>

                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);

                          // Courses do not have printed versions.
                          if (value === "Course") {
                            form.setValue("printedPrice", undefined);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-10 shadow-sm bg-background">
                            <SelectValue placeholder="Select a format" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          {productType.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ======================================================
                    DIGITAL / COURSE PRICE
                ====================================================== */}

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {isDigitalProduct ? "Digital Price" : "Course Price"}
                      </FormLabel>

                      <FormControl>
                        <div className="relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <DollarSign
                              className="size-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          </div>

                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="pl-9 h-10 bg-background focus-visible:ring-primary"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;

                              field.onChange(value === "" ? 0 : Number(value));
                            }}
                          />
                        </div>
                      </FormControl>

                      <FormMessage />

                      {isDigitalProduct && (
                        <p className="text-xs text-muted-foreground">
                          Price customers pay for the digital version.
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {/* ======================================================
                    PRINTED PRICE
                ====================================================== */}

                {isDigitalProduct && (
                  <FormField
                    control={form.control}
                    name="printedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <Printer className="size-4 text-muted-foreground" />
                          Printed Price
                          <span className="text-xs font-normal text-muted-foreground">
                            (Optional)
                          </span>
                        </FormLabel>

                        <FormControl>
                          <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <DollarSign
                                className="size-4 text-muted-foreground"
                                aria-hidden="true"
                              />
                            </div>

                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="pl-9 h-10 bg-background focus-visible:ring-primary"
                              placeholder="e.g. 29.99"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;

                                field.onChange(
                                  value === "" ? undefined : Number(value),
                                );
                              }}
                            />
                          </div>
                        </FormControl>

                        <FormMessage />

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          If you offer a physical printed version of this
                          product, enter its price here.
                        </p>
                      </FormItem>
                    )}
                  />
                )}

                {/* ======================================================
                    PRICING SUMMARY
                ====================================================== */}

                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  {/* PRODUCT TYPE */}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Product type
                    </span>

                    <span className="text-sm font-medium">{selectedType}</span>
                  </div>

                  {/* DIGITAL PRICE */}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {isDigitalProduct ? "Digital price" : "Course price"}
                    </span>

                    <span className="font-semibold">
                      ${Number(currentPrice || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* PRINTED PRICE */}

                  {isDigitalProduct && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Printed price
                      </span>

                      <span className="font-semibold">
                        {currentPrintedPrice !== undefined &&
                        currentPrintedPrice !== null
                          ? `$${Number(currentPrintedPrice).toFixed(2)}`
                          : "Not available"}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}

// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import slugify from "slugify";
// import { useForm, useWatch, Resolver } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   ArrowLeft,
//   Loader2,
//   SlidersHorizontal,
//   DollarSign,
//   Printer,
// } from "lucide-react";
// import { toast } from "sonner";

// import {
//   productSchema,
//   ProductSchemaType,
//   productType,
// } from "@/lib/zodSchemas";
// import { tryCatch } from "@/hooks/try-catch";
// import { CreateProduct } from "@/app/actions/manager-create-product";

// import { Button, buttonVariants } from "@/app/_components/ui/button";
// import { Input } from "@/app/_components/ui/input";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";

// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";

// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/app/_components/ui/form";

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/app/_components/ui/select";

// export default function ProductCreation() {
//   const router = useRouter();
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const form = useForm<ProductSchemaType>({
//     resolver: zodResolver(productSchema) as Resolver<ProductSchemaType>,
//     defaultValues: {
//       title: "",
//       description: "",
//       price: 0,
//       printedPrice: undefined,
//       type: "Course",
//       status: "Draft",
//       slug: "",
//     },
//   });

//   const slug = useWatch({
//     control: form.control,
//     name: "slug",
//   });

//   const selectedType = useWatch({
//     control: form.control,
//     name: "type",
//   });

//   const isDigitalProduct = selectedType !== "Course";
//   async function handleProcess(values: ProductSchemaType) {
//     setIsSubmitting(true);

//     try {
//       const submissionData: ProductSchemaType = {
//         ...values,
//         status: "Draft",
//         printedPrice:
//           values.type === "Course" ? undefined : values.printedPrice,
//       };

//       const { data: result, error } = await tryCatch(
//         CreateProduct(submissionData),
//       );

//       if (error) {
//         toast.error("An unexpected error occurred.");
//         return;
//       }

//       if (result.status === "success") {
//         toast.success("Product saved successfully!");
//         form.reset();

//         router.push("/manage/products");
//       } else if (result.status === "error") {
//         toast.error(result.message);
//       }
//     } catch {
//       toast.error("Something went wrong processing your submission.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(handleProcess)}
//         className="max-w-6xl w-full mx-auto px-0 py-8 lg:py-5 space-y-5"
//       >
//         {/* ============================================================
//             TOP CONTROL BAR
//         ============================================================ */}

//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
//           <div className="flex items-center gap-4">
//             <Link
//               href="/manage/products"
//               className={buttonVariants({
//                 variant: "ghost",
//                 size: "icon",
//               })}
//             >
//               <ArrowLeft className="size-5 text-muted-foreground hover:text-foreground transition-colors" />
//             </Link>

//             <div>
//               <h1 className="text-2xl font-semibold tracking-tight">
//                 Create a new product
//               </h1>

//               <p className="text-sm text-muted-foreground mt-1">
//                 Add your product information, pricing and settings.
//               </p>
//             </div>
//           </div>

//           <div className="flex items-center gap-3 self-end sm:self-auto">
//             <Link
//               href="/manage/products"
//               className={buttonVariants({
//                 variant: "ghost",
//               })}
//             >
//               Cancel
//             </Link>

//             <Button type="submit" disabled={isSubmitting} className="min-w-32">
//               {isSubmitting && <Loader2 className="animate-spin mr-2 size-4" />}
//               Save Draft
//             </Button>
//           </div>
//         </div>

//         {/* ============================================================
//             CONTENT LAYOUT
//         ============================================================ */}

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
//           {/* ============================================================
//               MAIN EDITING COLUMN
//           ============================================================ */}

//           <div className="lg:col-span-2 space-y-6">
//             <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
//               <CardContent className="space-y-6">
//                 {/* PRODUCT TITLE */}

//                 <FormField
//                   control={form.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-sm font-medium">
//                         Product Name
//                       </FormLabel>

//                       <FormControl>
//                         <Input
//                           className="h-11 shadow-sm focus-visible:ring-primary"
//                           placeholder="e.g., Advanced TypeScript Masterclass"
//                           {...field}
//                           onChange={(e) => {
//                             field.onChange(e);

//                             form.setValue(
//                               "slug",
//                               slugify(e.target.value, {
//                                 lower: true,
//                                 strict: true,
//                               }),
//                             );
//                           }}
//                         />
//                       </FormControl>

//                       {slug && (
//                         <p className="text-xs text-muted-foreground mt-1.5 px-1 truncate hidden">
//                           URL Preview:{" "}
//                           <span className="text-primary font-mono select-all">
//                             /products/{slug}
//                           </span>
//                         </p>
//                       )}

//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 {/* DESCRIPTION */}

//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-sm font-medium">
//                         Full Description
//                       </FormLabel>

//                       <FormControl>
//                         <div className="min-h-75 border border-input rounded-lg overflow-hidden bg-background focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm">
//                           <RichTextEditor field={field} />
//                         </div>
//                       </FormControl>

//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>
//           </div>

//           {/* ============================================================
//               SIDEBAR
//           ============================================================ */}

//           <div className="space-y-6 lg:sticky lg:top-6">
//             <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
//               <CardHeader>
//                 <CardTitle className="text-lg font-medium flex items-center gap-2">
//                   <SlidersHorizontal className="size-4 text-primary" />
//                   Logistics & Settings
//                 </CardTitle>
//               </CardHeader>

//               <CardContent className="space-y-6">
//                 {/* ======================================================
//                     PRODUCT TYPE
//                 ====================================================== */}

//                 <FormField
//                   control={form.control}
//                   name="type"
//                   render={({ field }) => (
//                     <FormItem className="flex flex-col">
//                       <FormLabel className="text-sm font-medium mb-1">
//                         Product Type
//                       </FormLabel>

//                       <Select
//                         value={field.value}
//                         onValueChange={(value) => {
//                           field.onChange(value);

//                           /*
//                            * If the manager switches to Course,
//                            * remove any previously entered printed price.
//                            */
//                           if (value === "Course") {
//                             form.setValue("printedPrice", undefined);
//                           }
//                         }}
//                       >
//                         <FormControl>
//                           <SelectTrigger className="w-full h-10 shadow-sm bg-background">
//                             <SelectValue placeholder="Select a format" />
//                           </SelectTrigger>
//                         </FormControl>

//                         <SelectContent>
//                           {productType.map((c) => (
//                             <SelectItem key={c} value={c}>
//                               {c}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>

//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 {/* ======================================================
//                     DIGITAL PRICE
//                 ====================================================== */}

//                 <FormField
//                   control={form.control}
//                   name="price"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-sm font-medium">
//                         {isDigitalProduct ? "Digital Price" : "Course Price"}
//                       </FormLabel>

//                       <FormControl>
//                         <div className="relative rounded-md shadow-sm">
//                           <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
//                             <DollarSign
//                               className="size-4 text-muted-foreground"
//                               aria-hidden="true"
//                             />
//                           </div>

//                           <Input
//                             type="number"
//                             min="0"
//                             step="0.01"
//                             className="pl-9 h-10 bg-background focus-visible:ring-primary"
//                             placeholder="0.00"
//                             {...field}
//                             onChange={(e) =>
//                               field.onChange(Number(e.target.value))
//                             }
//                           />
//                         </div>
//                       </FormControl>

//                       <FormMessage />

//                       {isDigitalProduct && (
//                         <p className="text-xs text-muted-foreground">
//                           Price customers pay for the digital version.
//                         </p>
//                       )}
//                     </FormItem>
//                   )}
//                 />

//                 {/* ======================================================
//                     PRINTED PRICE
//                 ====================================================== */}

//                 {isDigitalProduct && (
//                   <FormField
//                     control={form.control}
//                     name="printedPrice"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel className="text-sm font-medium flex items-center gap-2">
//                           <Printer className="size-4 text-muted-foreground" />
//                           Printed Price
//                           <span className="text-xs font-normal text-muted-foreground">
//                             (Optional)
//                           </span>
//                         </FormLabel>

//                         <FormControl>
//                           <div className="relative rounded-md shadow-sm">
//                             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
//                               <DollarSign
//                                 className="size-4 text-muted-foreground"
//                                 aria-hidden="true"
//                               />
//                             </div>

//                             <Input
//                               type="number"
//                               min="0"
//                               step="0.01"
//                               className="pl-9 h-10 bg-background focus-visible:ring-primary"
//                               placeholder="e.g. 29.99"
//                               value={field.value ?? ""}
//                               onChange={(e) => {
//                                 const value = e.target.value;

//                                 field.onChange(
//                                   value === "" ? undefined : Number(value),
//                                 );
//                               }}
//                             />
//                           </div>
//                         </FormControl>

//                         <FormMessage />

//                         <p className="text-xs text-muted-foreground leading-relaxed">
//                           If you offer a physical printed version of this
//                           product, enter its price here.
//                         </p>
//                       </FormItem>
//                     )}
//                   />
//                 )}

//                 {/* ======================================================
//                     PRICING SUMMARY
//                 ====================================================== */}

//                 <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm text-muted-foreground">
//                       Product type
//                     </span>

//                     <span className="text-sm font-medium">{selectedType}</span>
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <span className="text-sm text-muted-foreground">
//                       {isDigitalProduct ? "Digital price" : "Course price"}
//                     </span>

//                     <span className="font-semibold">
//                       ${Number(form.watch("price") || 0).toFixed(2)}
//                     </span>
//                   </div>

//                   {isDigitalProduct && (
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm text-muted-foreground">
//                         Printed price
//                       </span>

//                       <span className="font-semibold">
//                         {form.watch("printedPrice")
//                           ? `$${Number(form.watch("printedPrice")).toFixed(2)}`
//                           : "Not available"}
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </form>
//     </Form>
//   );
// }

// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import slugify from "slugify";
// import { useForm, useWatch, Resolver } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   ArrowLeft,
//   Loader2,
//   SlidersHorizontal,
//   DollarSign,
// } from "lucide-react";
// import { toast } from "sonner";

// import {
//   productSchema,
//   ProductSchemaType,
//   productType,
// } from "@/lib/zodSchemas";
// import { tryCatch } from "@/hooks/try-catch";
// import { CreateProduct } from "@/app/actions/manager-create-product";

// import { Button, buttonVariants } from "@/app/_components/ui/button";
// import { Input } from "@/app/_components/ui/input";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/app/_components/ui/form";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/app/_components/ui/select";

// export default function ProductCreation() {
//   const router = useRouter();
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

//   const form = useForm<ProductSchemaType>({
//     resolver: zodResolver(productSchema) as Resolver<ProductSchemaType>,
//     defaultValues: {
//       title: "",
//       description: "",
//       price: 0,
//       type: "Course",
//       status: "Draft",
//       slug: "",
//     },
//   });

//   const slug = useWatch({
//     control: form.control,
//     name: "slug",
//   });

//   async function handleProcess(values: ProductSchemaType) {
//     setIsSubmitting(true);

//     try {
//       const submissionData = {
//         ...values,
//         status: "Draft" as const,
//       };

//       const { data: result, error } = await tryCatch(
//         CreateProduct(submissionData),
//       );

//       if (error) {
//         toast.error("An unexpected error occurred.");
//         return;
//       }

//       if (result.status === "success") {
//         toast.success("Product saved successfully!");
//         form.reset();
//         router.push("/manage/products");
//       } else if (result.status === "error") {
//         toast.error(result.message);
//       }
//     } catch {
//       toast.error("Something went wrong processing your submission.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(handleProcess)}
//         className="max-w-6xl w-full mx-auto px-0 py-8 lg:py-5 space-y-5"
//       >
//         {/* Top Control Bar */}
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
//           <div className="flex items-center gap-4">
//             <Link
//               href="/manage/products"
//               className={buttonVariants({ variant: "ghost", size: "icon" })}
//             >
//               <ArrowLeft className="size-5 text-muted-foreground hover:text-foreground transition-colors" />
//             </Link>
//             <div>
//               <h1 className="text-2xl font-semibold tracking-tight">
//                 Create a new product
//               </h1>
//             </div>
//           </div>

//           <div className="flex items-center gap-3 self-end sm:self-auto">
//             <Link
//               href="/manage/products"
//               className={buttonVariants({ variant: "ghost" })}
//             >
//               Cancel
//             </Link>
//             <Button type="submit" disabled={isSubmitting} className="min-w-32">
//               {isSubmitting && <Loader2 className="animate-spin mr-2 size-4" />}
//               Save Draft
//             </Button>
//           </div>
//         </div>

//         {/* Content Layout */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
//           {/* Main Editing Column */}
//           <div className="lg:col-span-2 space-y-6">
//             <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
//               <CardContent className="space-y-6">
//                 <FormField
//                   control={form.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-sm font-medium">
//                         Product Name
//                       </FormLabel>
//                       <FormControl>
//                         <Input
//                           className="h-11 shadow-sm focus-visible:ring-primary"
//                           placeholder="e.g., Advanced TypeScript Masterclass"
//                           {...field}
//                           onChange={(e) => {
//                             field.onChange(e);
//                             form.setValue(
//                               "slug",
//                               slugify(e.target.value, {
//                                 lower: true,
//                                 strict: true,
//                               }),
//                             );
//                           }}
//                         />
//                       </FormControl>
//                       {slug && (
//                         <p className="text-xs text-muted-foreground mt-1.5 px-1 truncate hidden">
//                           URL Preview:{" "}
//                           <span className="text-primary font-mono select-all">
//                             /products/{slug}
//                           </span>
//                         </p>
//                       )}
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-sm font-medium">
//                         Full Description
//                       </FormLabel>
//                       <FormControl>
//                         <div className="min-h-75 border border-input rounded-lg overflow-hidden bg-background focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm">
//                           <RichTextEditor field={field} />
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>
//           </div>

//           {/* Sidebar Meta Column */}
//           <div className="space-y-6 lg:sticky lg:top-6">
//             <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
//               <CardHeader>
//                 <CardTitle className="text-lg font-medium flex items-center gap-2">
//                   <SlidersHorizontal className="size-4 text-primary" />{" "}
//                   Logistics & Settings
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-5">
//                 <FormField
//                   control={form.control}
//                   name="type"
//                   render={({ field }) => (
//                     <FormItem className="flex flex-col">
//                       <FormLabel className="text-sm font-medium mb-1">
//                         Product Type
//                       </FormLabel>
//                       <Select
//                         onValueChange={field.onChange}
//                         defaultValue={field.value}
//                       >
//                         <FormControl>
//                           <SelectTrigger className="w-full h-10 shadow-sm bg-background">
//                             <SelectValue placeholder="Select a format" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           {productType.map((c) => (
//                             <SelectItem key={c} value={c}>
//                               {c}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="price"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-sm font-medium">
//                         Pricing
//                       </FormLabel>
//                       <FormControl>
//                         <div className="relative rounded-md shadow-sm">
//                           <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
//                             <DollarSign
//                               className="size-4 text-muted-foreground"
//                               aria-hidden="true"
//                             />
//                           </div>
//                           <Input
//                             type="number"
//                             min="0"
//                             step="0.01"
//                             className="pl-9 h-10 bg-background focus-visible:ring-primary"
//                             placeholder="0.00"
//                             {...field}
//                             onChange={(e) =>
//                               field.onChange(Number(e.target.value))
//                             }
//                           />
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </form>
//     </Form>
//   );
// }

// "use client";

// import {
//   productSchema,
//   ProductSchemaType,
//   productType,
// } from "@/lib/zodSchemas";
// import { ArrowLeft, Loader2, Settings } from "lucide-react";
// import Link from "next/link";
// import { Resolver, useForm, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useState } from "react";
// import { tryCatch } from "@/hooks/try-catch";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";
// import slugify from "slugify";
// import { Button, buttonVariants } from "@/app/_components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/app/_components/ui/form";
// import { Input } from "@/app/_components/ui/input";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/app/_components/ui/select";
// import { CreateProduct } from "@/app/actions/educator-create-product";

// export default function ProductCreation() {
//   const router = useRouter();
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

//   const form = useForm<ProductSchemaType>({
//     resolver: zodResolver(productSchema) as Resolver<ProductSchemaType>,
//     defaultValues: {
//       title: "",
//       description: "",
//       price: 0,
//       type: "Course",
//       status: "Draft",
//       slug: "",
//       smallDescription: "",
//     },
//   });

//   const slug = useWatch({
//     control: form.control,
//     name: "slug",
//   });

//   async function handleProcess(values: ProductSchemaType) {
//     setIsSubmitting(true);

//     try {
//       const submissionData = {
//         ...values,
//         status: "Draft" as const,
//       };

//       const { data: result, error } = await tryCatch(
//         CreateProduct(submissionData),
//       );

//       if (error) {
//         toast.error("An unexpected error occurred.");
//         return;
//       }

//       if (result.status === "success") {
//         toast.success("Product saved successfully!");
//         form.reset();
//         router.push("/educator/products");
//       } else if (result.status === "error") {
//         toast.error(result.message);
//       }
//     } catch {
//       toast.error("Something went wrong processing your submission.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <Form {...form}>
//       <form className="max-w-6xl mx-auto pb-20 pt-5">
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
//           <div className="flex items-center gap-4">
//             <Link
//               href="/educator/products"
//               className={buttonVariants({ variant: "secondary", size: "icon" })}
//             >
//               <ArrowLeft className="size-5" />
//             </Link>
//             <div>
//               <h1 className="text-2xl font-bold tracking-tight">New Product</h1>
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             <Button
//               type="button"
//               variant="outline"
//               disabled={isSubmitting}
//               onClick={form.handleSubmit(handleProcess)}
//               className="min-w-32"
//             >
//               {isSubmitting && <Loader2 className="animate-spin mr-2 size-4" />}
//               Save Draft
//             </Button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2 space-y-6">
//             <Card className="shadow-sm">
//               <CardContent className="space-y-6">
//                 <FormField
//                   control={form.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem className="relative pb-5">
//                       <FormLabel className="font-semibold text-base">
//                         Product Name
//                       </FormLabel>
//                       <FormControl>
//                         <Input
//                           className="text-lg h-12"
//                           placeholder="Enter a catchy title..."
//                           {...field}
//                           onChange={(e) => {
//                             field.onChange(e);
//                             form.setValue(
//                               "slug",
//                               slugify(e.target.value, { lower: true }),
//                             );
//                           }}
//                         />
//                       </FormControl>
//                       {slug && (
//                         <p className="absolute bottom-0 right-0 text-xs italic text-muted-foreground">
//                           Slug: {slug}
//                         </p>
//                       )}
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="smallDescription"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="font-semibold">
//                         Short Summary
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea
//                           rows={3}
//                           placeholder="A short hook..."
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="font-semibold">
//                         Full Description
//                       </FormLabel>
//                       <FormControl>
//                         <div className="min-h-75 border rounded-md">
//                           <RichTextEditor field={field} />
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>
//           </div>

//           <div className="space-y-3">
//             <Card className="shadow-sm">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2 text-base">
//                   <Settings className="size-4" /> Organization & Settings
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <div className="grid grid-cols-2 gap-2 pt-2">
//                   <FormField
//                     control={form.control}
//                     name="type"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Product Type</FormLabel>
//                         <Select
//                           onValueChange={field.onChange}
//                           defaultValue={field.value}
//                         >
//                           <FormControl>
//                             <SelectTrigger className="bg-white w-40">
//                               <SelectValue placeholder="Select a category" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             {productType.map((c) => (
//                               <SelectItem key={c} value={c}>
//                                 {c}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 pt-2">
//                   <FormField
//                     control={form.control}
//                     name="price"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Price ($)</FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             placeholder="Price"
//                             {...field}
//                             onChange={(e) =>
//                               field.onChange(Number(e.target.value))
//                             }
//                           />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </form>
//     </Form>
//   );
// }

// "use client";

// import {
//   deliveryType,
//   productCategories,
//   productSchema,
//   ProductSchemaType,
// } from "@/lib/zodSchemas";
// import { ArrowLeft, Loader2, SendHorizonal } from "lucide-react";
// import Link from "next/link";
// import { Resolver, useForm, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useState, useEffect } from "react";
// import { tryCatch } from "@/hooks/try-catch";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";
// import { useConfetti } from "@/hooks/use-confetti";
// import slugify from "slugify";
// import { Button, buttonVariants } from "@/app/_components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/app/_components/ui/form";
// import { Input } from "@/app/_components/ui/input";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { RichTextEditor } from "@/app/_components/rich-text-editor/Editor";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/app/_components/ui/select";
// import { Image as ImageIcon, Settings } from "lucide-react";
// import { CreateProduct } from "@/app/actions/educator-create-product";
// import { ImageUploader } from "@/app/_components/file-uploader/Uploader";
// import { useUploadThing } from "@/lib/uploadthing";

// export default function ProductCreationPage() {
//   const router = useRouter();
//   const { triggerConfetti } = useConfetti();
//   const [isSubmitting, setIsSubmitting] = useState<"Draft" | "Pending" | null>(
//     null,
//   );

//   const [selectedImage, setSelectedImage] = useState<File | null>(null);

//   const { startUpload } = useUploadThing("mediaUploader");

//   const form = useForm<ProductSchemaType>({
//     resolver: zodResolver(productSchema) as Resolver<ProductSchemaType>,
//     defaultValues: {
//       title: "",
//       description: "",
//       fileKey: "",
//       price: 0,
//       duration: 0,
//       category: "Course",
//       deliveryType: "Download",
//       status: "Draft",
//       slug: "",
//       smallDescription: "",
//     },
//   });

//   const slug = useWatch({
//     control: form.control,
//     name: "slug",
//   });

//   // 1. Watch the category field value
//   const category = useWatch({
//     control: form.control,
//     name: "category",
//   });

//   useEffect(() => {
//     if (category !== "Course") {
//       // Cast to unknown then to the expected field type to safely bypass strict primitive assignments
//       form.setValue(
//         "duration",
//         undefined as unknown as ProductSchemaType["duration"],
//         {
//           shouldValidate: true,
//         },
//       );
//     }
//   }, [category, form]);

//   async function handleProcess(
//     values: ProductSchemaType,
//     targetStatus: "Draft" | "Pending",
//   ) {
//     setIsSubmitting(targetStatus);

//     try {
//       let finalFileKey = values.fileKey;

//       if (selectedImage) {
//         const uploadRes = await startUpload([selectedImage]);

//         if (!uploadRes || uploadRes.length === 0) {
//           toast.error("Failed to upload thumbnail image to cloud storage.");
//           setIsSubmitting(null);
//           return;
//         }

//         finalFileKey = uploadRes[0].url;
//         form.setValue("fileKey", finalFileKey);
//       }

//       const submissionData = {
//         ...values,
//         fileKey: finalFileKey,
//         status: targetStatus,
//       };

//       const { data: result, error } = await tryCatch(
//         CreateProduct(submissionData),
//       );

//       if (error) {
//         toast.error("An unexpected error occurred.");
//         return;
//       }

//       if (result.status === "success") {
//         toast.success(
//           targetStatus === "Pending"
//             ? "Product submitted for review!"
//             : "Draft saved successfully!",
//         );

//         if (targetStatus === "Pending") triggerConfetti();

//         form.reset();
//         setSelectedImage(null);
//         router.push("/educator/products");
//       } else if (result.status === "error") {
//         toast.error(result.message);
//       }
//     } catch {
//       toast.error("Something went wrong processing your submission.");
//     } finally {
//       setIsSubmitting(null);
//     }
//   }

//   return (
//     <Form {...form}>
//       <form className="max-w-6xl mx-auto pb-20 pt-5">
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
//           <div className="flex items-center gap-4">
//             <Link
//               href="/educator/products"
//               className={buttonVariants({ variant: "secondary", size: "icon" })}
//             >
//               <ArrowLeft className="size-5" />
//             </Link>
//             <div>
//               <h1 className="text-3xl font-bold tracking-tight">New Product</h1>
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             <Button
//               type="button"
//               variant="outline"
//               disabled={!!isSubmitting}
//               onClick={form.handleSubmit((v) => handleProcess(v, "Draft"))}
//             >
//               {isSubmitting === "Draft" && (
//                 <Loader2 className="animate-spin mr-2 size-4" />
//               )}
//               Save Draft
//             </Button>
//             <Button
//               type="button"
//               className="bg-primary hover:bg-primary/90 min-w-40"
//               disabled={!!isSubmitting}
//               onClick={form.handleSubmit((v) => handleProcess(v, "Pending"))}
//             >
//               {isSubmitting === "Pending" ? (
//                 <Loader2 className="animate-spin mr-2 size-4" />
//               ) : (
//                 <SendHorizonal className="mr-2 size-4" />
//               )}
//               Submit for review
//             </Button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2 space-y-6">
//             <Card className="shadow-sm">
//               <CardContent className="space-y-6">
//                 <FormField
//                   control={form.control}
//                   name="title"
//                   render={({ field }) => (
//                     <FormItem className="relative pb-5">
//                       <FormLabel className="font-semibold text-base">
//                         Product (Course) Title
//                       </FormLabel>
//                       <FormControl>
//                         <Input
//                           className="text-lg h-12"
//                           placeholder="Enter a catchy title..."
//                           {...field}
//                           onChange={(e) => {
//                             field.onChange(e);
//                             form.setValue(
//                               "slug",
//                               slugify(e.target.value, { lower: true }),
//                             );
//                           }}
//                         />
//                       </FormControl>
//                       {slug && (
//                         <p className="absolute bottom-0 right-0 text-xs italic text-muted-foreground">
//                           Slug: {slug}
//                         </p>
//                       )}
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="smallDescription"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="font-semibold">
//                         Short Summary
//                       </FormLabel>
//                       <FormControl>
//                         <Textarea
//                           rows={3}
//                           placeholder="A short hook..."
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="description"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="font-semibold">
//                         Full Description
//                       </FormLabel>
//                       <FormControl>
//                         <div className="min-h-75 border rounded-md">
//                           <RichTextEditor field={field} />
//                         </div>
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>
//           </div>

//           <div className="space-y-3">
//             <Card className="shadow-sm">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2 text-base">
//                   <Settings className="size-4" /> Organization & Settings
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 <div className="grid grid-cols-2 gap-2 pt-2">
//                   <FormField
//                     control={form.control}
//                     name="category"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Category</FormLabel>
//                         <Select
//                           onValueChange={field.onChange}
//                           defaultValue={field.value}
//                         >
//                           <FormControl>
//                             <SelectTrigger className="bg-white w-36">
//                               <SelectValue placeholder="Select a category" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             {productCategories.map((c) => (
//                               <SelectItem key={c} value={c}>
//                                 {c}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="deliveryType"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Delivery Type</FormLabel>
//                         <Select
//                           onValueChange={field.onChange}
//                           defaultValue={field.value}
//                         >
//                           <FormControl>
//                             <SelectTrigger className="bg-white w-37">
//                               <SelectValue placeholder="Select a category" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             {deliveryType.map((c) => (
//                               <SelectItem key={c} value={c}>
//                                 {c}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 pt-2">
//                   <FormField
//                     control={form.control}
//                     name="price"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Price ($)</FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             placeholder="Price"
//                             {...field}
//                             onChange={(e) =>
//                               field.onChange(Number(e.target.value))
//                             }
//                           />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="duration"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Duration (hrs) </FormLabel>
//                         <FormControl>
//                           <Input
//                             type="number"
//                             placeholder="Duration"
//                             {...field}
//                             // 3. Enable conditionally & handle value fallback seamlessly
//                             disabled={category !== "Course"}
//                             value={field.value ?? ""}
//                             onChange={(e) => {
//                               const val = e.target.value;
//                               field.onChange(
//                                 val === "" ? undefined : Number(val),
//                               );
//                             }}
//                           />
//                         </FormControl>
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="shadow-sm overflow-hidden">
//               <CardHeader className="bg-muted/50">
//                 <CardTitle className="flex items-center gap-2 text-base">
//                   <ImageIcon className="size-4" /> Thumbnail
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="pt-6">
//                 <FormField
//                   control={form.control}
//                   name="fileKey"
//                   render={({}) => (
//                     <FormItem>
//                       <FormControl>
//                         <ImageUploader
//                           onChange={(file) => {
//                             setSelectedImage(file);
//                             form.setValue("fileKey", file ? file.name : "");
//                           }}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </form>
//     </Form>
//   );
// }
