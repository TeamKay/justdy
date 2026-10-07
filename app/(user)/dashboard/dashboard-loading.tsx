export default function DashboardLoading() {
  return (
    <div className="min-h-[70vh] animate-pulse space-y-6 bg-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="h-40 rounded-3xl bg-muted" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-2xl bg-muted lg:col-span-2" />
        <div className="h-80 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

