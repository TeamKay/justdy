import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { educatorGetCourse } from "@/app/actions/educator-get-course";
import { EditCourseForm } from "@/app/_components/EditCourseForm";
import CourseStructure from "@/app/_components/CourseStructure";

type Params = Promise<{ courseId: string }>;

export default async function EditRoute({ params }: { params: Params }) {
  const { courseId } = await params;
  const data = await educatorGetCourse(courseId);

  return (
    /* Added responsive padding and a max-width container for a professional look */
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Edit Course: <span className="text-primary">{data.title}</span>
        </h1>
        <p className="text-muted-foreground">
          Manage your course details, curriculum, and settings from one place.
        </p>
      </header>

      <Tabs defaultValue="basic-info" className="w-full">
        {/* Modernized TabList with better spacing */}
        <TabsList className="inline-flex h-11 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full sm:w-auto mb-4">
          <TabsTrigger value="basic-info" className="px-8">
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="course-structure" className="px-8">
            Course Structure
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info" className="mt-0">
          <Card className="shadow-sm border-zinc-200">
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Update the title, description, and thumbnail of your course.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <EditCourseForm data={data} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="course-structure" className="mt-0">
          <Card className="shadow-sm border-zinc-200">
            <CardHeader>
              <CardTitle>Course Structure</CardTitle>
              <CardDescription>
                Organize your curriculum into sections and lessons.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseStructure data={data} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// import { EditCourseForm } from "./_components/EditCourseForm";
// import CourseStructure from "./_components/CourseStructure";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
// import { educatorGetCourse } from "@/app/actions/educator-get-course";

// type Params = Promise<{courseId: string}>;

// export default async function EditRoute({params}: {params: Params}){
//     const {courseId} = await params;
//     const data = await educatorGetCourse(courseId);
//     return(
//         <div>
//             <h1 className="text-3xl font-bold mb-8">
//                 Edit Course: <span className="text-primary underline">{data.title}</span>
//             </h1>

//             <Tabs defaultValue="basic-info" className="w-full">
//                 <TabsList className="grid grid-cols-2 w-full">
//                     <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
//                     <TabsTrigger value="course-structure">Course Structure</TabsTrigger>
//                 </TabsList>

//                 <TabsContent value="basic-info">
//                     <Card>
//                         <CardContent>
//                              <EditCourseForm data={data}/>
//                         </CardContent>
//                     </Card>
//                 </TabsContent>

//                 <TabsContent value="course-structure">
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>Course Structure</CardTitle>
//                             <CardDescription>
//                                 Update the course structure and curriculum
//                             </CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <CourseStructure data={data}/>
//                         </CardContent>
//                     </Card>
//                 </TabsContent>
//             </Tabs>
//         </div>
//     )
// }
