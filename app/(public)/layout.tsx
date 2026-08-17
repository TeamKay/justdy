import FooterController from "../_components/FooterController";
import NavbarServer from "../_components/NavbarServer";
// import { ThemeToggle } from "../_components/themeToggle";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <NavbarServer />
      <main className="grow">{children}</main>

      {/* Floating Professional Round Theme Toggle */}
      <div className="fixed bottom-6 right-6 z-50">{/* <ThemeToggle /> */}</div>
      <FooterController />
    </div>
  );
}
