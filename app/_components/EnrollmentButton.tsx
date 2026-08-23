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

  const purchaseType: PurchaseType = product?.purchaseType ?? "course";

  function getCartKey(productId: string, type: PurchaseType) {
    return `${productId}-${type}`;
  }

  async function handleAddToCart() {
    if (isPending || isAdded) {
      return;
    }

    if (!product) {
      console.error("EnrollmentButton: Product details are required.");

      toast.error("Unable to add this product to your cart.");

      return;
    }

    setIsPending(true);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    try {
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

      localStorage.setItem("cart", JSON.stringify(cartItems));

      window.dispatchEvent(new Event("cartUpdated"));

      setIsAdded(true);

      toast.success(`${product.title} added to your cart.`);
    } catch (error) {
      console.error("Failed to add product to cart:", error);

      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleAddToCart}
      disabled={isPending || isAdded}
      aria-busy={isPending}
      className="
        w-full
        bg-blue-500
        text-white
        hover:bg-blue-600
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
