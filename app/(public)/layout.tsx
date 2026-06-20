import FooterController from "../_components/FooterController";
import NavbarServer from "../_components/NavbarServer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarServer />
      <main className="grow">{children}</main>

      <FooterController />
    </div>
  );
}

// import FooterPage from "../_components/FooterPage";
// import NavbarServer from "../_components/NavbarServer";

// export default function PublicLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="min-h-screen flex flex-col">
//       <NavbarServer />
//       <main className="grow">{children}</main>
//       <FooterPage />
//     </div>
//   );
// }
