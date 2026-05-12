"use client";

import { buttonVariants } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { useConfetti } from "@/hooks/use-confetti";
import { ArrowLeft, CheckIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function PaymentSuccessful() {
  const { triggerConfetti } = useConfetti();

  useEffect(() => {
    triggerConfetti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="w-full min-h-screen flex flex-1 justify-center items-center">
      <Card className="w-87.5">
        <CardContent>
          <div className="w-full flex justify-center">
            <CheckIcon className="size-12 p-2 bg-green-500/30 text-green-500 rounded-full" />
          </div>
          <div className="mt-3 text-center sm:mt-5 w-full">
            <h2 className="text-xl font-semibold">Payment Successful</h2>
            <p className="text-sm mt-2 text-muted-foreground tracking-tight text-balance">
              Congratulations
            </p>
            <p className="text-sm mt-2 text-muted-foreground tracking-tight text-balance">
              Your payment was successful. You should now have full access to
              the course.
            </p>

            <Link
              href="/"
              className={buttonVariants({ className: "w-full mt-5" })}
            >
              <ArrowLeft className="size-4" />
              Go to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
