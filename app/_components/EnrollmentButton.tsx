"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ShoppingCart } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { toast } from "sonner";

export type PurchaseType = "course" | "digital" | "printed";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  purchaseType: PurchaseType;
}

interface EnrollmentButtonProps {
  courseId: string;
  buttonText?: string;

  product?: {
    id: string;
    title: string;
    price: number;
    image?: string;
    purchaseType?: PurchaseType;
  };
}

export function EnrollmentButton({
  courseId,
  buttonText = "Add to Cart",
  product,
}: EnrollmentButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  /*
   * ============================================================
   * DETERMINE PURCHASE TYPE
   * ============================================================
   *
   * Course:
   *   Can only be purchased once.
   *
   * Digital:
   *   Can only be purchased once.
   *
   * Printed:
   *   Multiple copies are allowed.
   */

  const purchaseType: PurchaseType = product?.purchaseType ?? "course";

  /*
   * ============================================================
   * CREATE UNIQUE CART KEY
   * ============================================================
   *
   * The same product can exist as:
   *
   * product123-digital
   * product123-printed
   *
   * These are treated as separate cart items.
   */

  function getCartKey(productId: string, type: PurchaseType) {
    return `${productId}-${type}`;
  }

  /*
   * ============================================================
   * ADD TO CART
   * ============================================================
   */

  async function handleAddToCart() {
    /*
     * Prevent double clicks.
     */

    if (isPending || isAdded) {
      return;
    }

    /*
     * Make sure product information exists.
     */

    if (!product) {
      console.error("EnrollmentButton: Product details are required.");

      toast.error("Unable to add this product to your cart.");

      return;
    }

    /*
     * ==========================================================
     * START LOADING
     * ==========================================================
     *
     * Set the state first and yield to the browser so React
     * can render the spinner before the cart processing begins.
     */

    setIsPending(true);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    try {
      /*
       * ========================================================
       * GET EXISTING CART
       * ========================================================
       */

      const savedCart = localStorage.getItem("cart");

      let cartItems: CartItem[] = [];

      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);

          if (Array.isArray(parsed)) {
            cartItems = parsed.filter(
              (item): item is CartItem =>
                item && typeof item === "object" && typeof item.id === "string",
            );
          }
        } catch (error) {
          console.error("Failed to parse existing cart:", error);

          /*
           * If the saved cart is corrupted,
           * start with an empty cart.
           */

          cartItems = [];
        }
      }

      /*
       * ========================================================
       * CREATE UNIQUE CART KEY
       * ========================================================
       */

      const cartKey = getCartKey(product.id, purchaseType);

      /*
       * ========================================================
       * FIND EXISTING ITEM
       * ========================================================
       */

      const existingIndex = cartItems.findIndex((item) => {
        /*
         * Support older cart items that don't have
         * purchaseType yet.
         */

        const itemType: PurchaseType =
          item.purchaseType ?? (item.id === courseId ? "course" : "digital");

        return getCartKey(item.id, itemType) === cartKey;
      });

      /*
       * ========================================================
       * COURSE
       * ========================================================
       *
       * Courses can only be purchased once.
       */

      if (purchaseType === "course") {
        if (existingIndex !== -1) {
          setIsAdded(true);

          toast.info("This course is already in your cart.");

          return;
        }

        cartItems.push({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          quantity: 1,
          purchaseType: "course",
        });
      } else if (purchaseType === "digital") {

      /*
       * ========================================================
       * DIGITAL PRODUCT
       * ========================================================
       *
       * Digital products can only be purchased once.
       */
        if (existingIndex !== -1) {
          setIsAdded(true);

          toast.info("This digital product is already in your cart.");

          return;
        }

        cartItems.push({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          quantity: 1,
          purchaseType: "digital",
        });
      } else if (purchaseType === "printed") {

      /*
       * ========================================================
       * PRINTED PRODUCT
       * ========================================================
       *
       * Printed products can have multiple copies.
       */
        if (existingIndex !== -1) {
          const existingItem = cartItems[existingIndex];

          cartItems[existingIndex] = {
            ...existingItem,
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: (existingItem.quantity || 1) + 1,
            purchaseType: "printed",
          };
        } else {
          cartItems.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1,
            purchaseType: "printed",
          });
        }
      }

      /*
       * ========================================================
       * SAVE CART
       * ========================================================
       */

      localStorage.setItem("cart", JSON.stringify(cartItems));

      /*
       * ========================================================
       * NOTIFY NAVBAR / CART
       * ========================================================
       *
       * Any component listening for "cartUpdated" will
       * immediately refresh its cart information.
       */

      window.dispatchEvent(new Event("cartUpdated"));

      /*
       * ========================================================
       * SUCCESS STATE
       * ========================================================
       */

      setIsAdded(true);

      toast.success(`${product.title} added to your cart.`);
    } catch (error) {
      console.error("Failed to add product to cart:", error);

      toast.error("Something went wrong. Please try again.");
    } finally {
      /*
       * Always stop the loading spinner.
       */

      setIsPending(false);
    }
  }

  /*
   * ============================================================
   * BUTTON
   * ============================================================
   */

  return (
    <Button
      type="button"
      onClick={handleAddToCart}
      disabled={isPending || isAdded}
      aria-busy={isPending}
      className="
        w-full
        bg-[#857938]
        text-white
        hover:bg-[#857000]
        disabled:cursor-not-allowed
        disabled:opacity-70
        flex
        items-center
        justify-center
        gap-2
        transition-all
        duration-200
      "
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />

          <span>Adding...</span>
        </>
      ) : isAdded ? (
        <>
          <CheckCircle2 className="size-4" aria-hidden="true" />

          <span>Already in Cart</span>
        </>
      ) : (
        <>
          <ShoppingCart className="size-4" aria-hidden="true" />

          <span>{buttonText}</span>
        </>
      )}
    </Button>
  );
}

// "use client";

// import { useState } from "react";
// import { Loader2, CheckCircle2 } from "lucide-react";
// import { Button } from "@/app/_components/ui/button";

// interface CartItem {
//   id: string;
//   title: string;
//   price: number;
//   image?: string;
//   quantity?: number;
// }

// interface EnrollmentButtonProps {
//   courseId: string;
//   buttonText?: string;
//   // Add the product object so we have the details needed for the cart
//   product?: {
//     id: string;
//     title: string;
//     price: number;
//     image?: string;
//   };
// }

// export function EnrollmentButton({
//   buttonText = "Add to Cart",
//   product,
// }: EnrollmentButtonProps) {
//   const [isPending, setIsPending] = useState(false);
//   const [isAdded, setIsAdded] = useState(false);

//   function handleAddToCart() {
//     if (!product) {
//       console.error("Product details are required to add to cart");
//       return;
//     }

//     setIsPending(true);

//     // Simulate a tiny delay so the user feels the button click action
//     setTimeout(() => {
//       const savedCart = localStorage.getItem("cart");
//       let cartItems: CartItem[] = [];

//       if (savedCart) {
//         try {
//           const parsed = JSON.parse(savedCart);
//           if (Array.isArray(parsed)) {
//             cartItems = parsed as CartItem[];
//           }
//         } catch (e) {
//           console.error("Failed to parse cart", e);
//         }
//       }

//       // Check if item already exists in cart
//       const existingIndex = cartItems.findIndex(
//         (item) => item.id === product.id,
//       );

//       if (existingIndex > -1) {
//         // Increment quantity if it exists
//         cartItems[existingIndex].quantity =
//           (cartItems[existingIndex].quantity || 1) + 1;
//       } else {
//         // Add new item to cart
//         cartItems.push({
//           id: product.id,
//           title: product.title,
//           price: product.price,
//           image: product.image,
//           quantity: 1,
//         });
//       }

//       // Save to localStorage
//       localStorage.setItem("cart", JSON.stringify(cartItems));

//       // Dispatch event to update the Navbar cart badge instantly
//       window.dispatchEvent(new Event("cartUpdated"));

//       setIsPending(false);
//       setIsAdded(true);

//       // Revert button text back to normal after 2 seconds
//       setTimeout(() => setIsAdded(false), 2000);
//     }, 400);
//   }

//   return (
//     <Button
//       onClick={handleAddToCart}
//       disabled={isPending || isAdded}
//       className="w-full bg-[#857938] text-white hover:bg-[#857000] flex items-center justify-center gap-2 transition-all"
//     >
//       {isPending ? (
//         <>
//           <Loader2 className="size-4 animate-spin" />
//           <span>Adding...</span>
//         </>
//       ) : isAdded ? (
//         <>
//           <CheckCircle2 className="size-4" />
//           <span>Added to Cart</span>
//         </>
//       ) : (
//         <span>{buttonText}</span>
//       )}
//     </Button>
//   );
// }

// "use client";

// import { useTransition } from "react";
// import { Loader2 } from "lucide-react";
// import { enrollInCourseAction } from "@/app/actions/enroll-in-course-button";
// import { Button } from "@/app/_components/ui/button";

// interface EnrollmentButtonProps {
//   courseId: string;
//   buttonText?: string;
// }

// export function EnrollmentButton({
//   courseId,
//   buttonText = "Add to Cart",
// }: EnrollmentButtonProps) {
//   const [pending, startTransition] = useTransition();

//   function onSubmit() {
//     startTransition(async () => {
//       const res = await enrollInCourseAction(courseId);

//       if (res?.status === "success" && res.checkoutUrl) {
//         // Force full page redirect to external Stripe Checkout domain
//         window.location.href = res.checkoutUrl;
//       } else if (res?.status === "error") {
//         // Optional: show a toast notification or alert
//         alert(res.message || "Something went wrong during checkout.");
//       }
//     });
//   }

//   const loadingText =
//     buttonText === "Add to Cart" ? "Adding..." : "Processing...";

//   return (
//     <Button
//       onClick={onSubmit}
//       disabled={pending}
//       className="w-full bg-[#857938] text-white hover:bg-[#857000] flex items-center justify-center gap-2"
//     >
//       {pending ? (
//         <>
//           <Loader2 className="size-4 animate-spin" />
//           <span>{loadingText}</span>
//         </>
//       ) : (
//         <span>{buttonText}</span>
//       )}
//     </Button>
//   );
// }

// "use client";

// import { useTransition } from "react";
// import { Loader2 } from "lucide-react";
// import { enrollInCourseAction } from "@/app/actions/enroll-in-course-button";
// import { Button } from "@/app/_components/ui/button";

// interface EnrollmentButtonProps {
//   courseId: string;
//   buttonText?: string;
// }

// export function EnrollmentButton({
//   courseId,
//   buttonText = "Enroll Now",
// }: EnrollmentButtonProps) {
//   const [pending, startTransition] = useTransition();

//   function onSubmit() {
//     startTransition(async () => {
//       await enrollInCourseAction(courseId);
//     });
//   }

//   // Set contextual loading state based on button text
//   const loadingText =
//     buttonText === "Enroll Now" ? "Enrolling..." : "Processing...";

//   return (
//     <Button
//       onClick={onSubmit}
//       disabled={pending}
//       className="w-full bg-[#857938] text-white hover:bg-[#857000] flex items-center justify-center gap-2"
//     >
//       {pending ? (
//         <>
//           <Loader2 className="size-4 animate-spin" />
//           <span>{loadingText}</span>
//         </>
//       ) : (
//         <span>{buttonText}</span>
//       )}
//     </Button>
//   );
// }

// "use client";

// import { useTransition } from "react";
// import { Loader2 } from "lucide-react";
// import { enrollInCourseAction } from "@/app/actions/enroll-in-course-button";
// import { Button } from "@/app/_components/ui/button";

// interface EnrollmentButtonProps {
//   courseId: string;
// }

// export function EnrollmentButton({ courseId }: EnrollmentButtonProps) {
//   const [pending, startTransition] = useTransition();

//   function onSubmit() {
//     startTransition(async () => {
//       await enrollInCourseAction(courseId);
//     });
//   }

//   return (
//     <Button
//       onClick={onSubmit}
//       disabled={pending}
//       className="w-full bg-[#857938] text-white hover:bg-[#857000] flex items-center justify-center gap-2"
//     >
//       {pending ? (
//         <>
//           <Loader2 className="size-4 animate-spin" />
//           <span>Enrolling...</span>
//         </>
//       ) : (
//         <span>Enroll Now</span>
//       )}
//     </Button>
//   );
// }
