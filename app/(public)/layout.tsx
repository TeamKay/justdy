import { Suspense } from "react";
import FooterController from "../_components/FooterController";
import NavbarServer from "../_components/NavbarServer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-16 w-full" />}>
        <NavbarServer />
      </Suspense>

      <main className="grow">{children}</main>

      <Suspense fallback={null}>
        <FooterController />
      </Suspense>
    </div>
  );
}
