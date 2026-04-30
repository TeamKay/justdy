export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-container">
      {/* Maybe a Sidebar here, but NO Navbar/Footer */}
      <main>{children}</main>
    </div>
  );
}
