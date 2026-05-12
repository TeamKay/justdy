import { IconBook2, IconBookmark, IconCategoryPlus, IconLockHeart, IconUsers } from "@tabler/icons-react"

import { adminGetDashboardStats } from "@/app/actions/admin-get-dashboard-stats"
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card"

export async function AdminDashboardSectionCards() {
  const {totalSignups, totalCustomers, totalCourses, totalLessons} = await adminGetDashboardStats()
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-5">
      
      <Card className="@container/card bg-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="">
          <CardDescription>Total Students</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalSignups}
          </CardTitle>
          </div>
           <IconUsers className="size-10 text-muted-foreground rounded-lg border border-emerald-800 p-2 mr-2" />
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="">
          <CardDescription>Total Enrollments</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalCustomers}
          </CardTitle>
          </div>
          <IconBook2 className="size-10 text-muted-foreground rounded-lg border border-emerald-800 p-2 mr-2" />
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="">
          <CardDescription>Total Educators</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
           {totalCustomers}
          </CardTitle>
          </div>
           <IconBookmark className="size-10 text-muted-foreground rounded-lg border border-emerald-800 p-2 mr-2" />
        </CardHeader>
      </Card>
       
      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="">
          <CardDescription>Total Courses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalCourses}
          </CardTitle>
          </div>
          <IconCategoryPlus className="size-10 text-muted-foreground rounded-lg border border-emerald-800 p-2 mr-2" />
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="">
          <CardDescription>Total Lessons</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalLessons}
          </CardTitle>
          </div>
           <IconLockHeart className="size-10 text-muted-foreground rounded-lg border border-emerald-800 p-2 mr-2" />
        </CardHeader>
      </Card>
    </div>
  )
}
