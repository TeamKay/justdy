import NavbarServer from "@/app/_components/NavbarServer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Navbar takes natural height */}
      <div className="shrink-0">
        <NavbarServer />
      </div>

      {/* Main fills remaining space */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
