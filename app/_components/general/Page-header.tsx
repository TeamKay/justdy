// import Link from "next/link";
// import React, { ReactElement } from "react";
// import { Button } from "./ui/button";
// import { ArrowLeft } from "lucide-react";

// interface PageHeaderProps {
//   icon?: ReactElement<{ className?: string }>;
//   title: string;
//   backLink?: string;
//   backLabel?: string;
// }

// const PageHeader = ({
//   icon,
//   title,
//   backLink = "/",
//   backLabel = "Back to Home",
// }: PageHeaderProps) => {
//   return (
//     <div className="flex flex-col justify-between gap-5 mb-8">
//       <Link href={backLink}>
//         <Button variant="outline" size="sm" className="border-emerald-900/30">
//           <ArrowLeft className="mr-2 size-4" />
//           {backLabel}
//         </Button>
//       </Link>

//       <div className="flex items-end gap-2">
//         {icon && (
//           <div className="text-emerald-400">
//             {React.cloneElement(icon, { className: "size-10" })}
//           </div>
//         )}
//         <h1 className="text-4xl md:text-5xl gradient-title">{title}</h1>
//       </div>
//     </div>
//   );
// };

// export default PageHeader;
