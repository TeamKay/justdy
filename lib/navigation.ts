import { ROLES } from "./roles";

export const navigation = {
  [ROLES.STUDENT]: [
    { name: "Courses", href: "/courses" },
    { name: "My Learning", href: "/student/my-learning" },
    { name: "Certificates", href: "/student/certificates" },
  ],

  [ROLES.EDUCATOR]: [
    { name: "Courses", href: "/courses" },
    { name: "My Courses", href: "/educator/courses" },
    { name: "Create Course", href: "/educator/create-course" },
    { name: "Analytics", href: "/educator/analytics" },
  ],

  [ROLES.ADMIN]: [
    { name: "Dashboard", href: "/admin/dashboard" },
    { name: "Users", href: "/admin/users" },
    { name: "Courses", href: "/admin/courses" },
    { name: "Reports", href: "/admin/reports" },
  ],
};
