"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Separator } from "@/app/_components/ui/separator";
// Added ArrowLeft icon
import {
  Calendar1Icon,
  Medal,
  User,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import AppointmentForm from "./AppointmentForm";
import { useRouter } from "next/navigation";
import { isSameDay, format } from "date-fns";

import { Badge } from "@/app/_components/ui/badge";
import { Calendar } from "@/app/_components/ui/calendar";
import Link from "next/link"; // Added Link for navigation

type Educator = {
  id: string;
  name: string;
  imageUrl?: string | null;
  specialty: string | null;
  // Change this line to include null
  experience: number | string | null;
  description: string | null; // Added null here too just in case
};

interface TimeSlot {
  startTime: string;
  endTime: string;
  formatted: string;
  day: string;
  availabilityId: string;
}

interface DayWithSlots {
  date: string;
  displayDate: string;
  slots: TimeSlot[];
}

interface EducatorProfileProps {
  educator: Educator;
  availableDays: DayWithSlots[];
}

export default function EducatorProfile({
  educator,
  availableDays = [],
}: EducatorProfileProps) {
  const [tempSelectedSlot, setTempSelectedSlot] = useState<TimeSlot | null>(
    null,
  );
  const [confirmedSlot, setConfirmedSlot] = useState<TimeSlot | null>(null);
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const hasAvailableSlots = availableDays.some(
    (day) => day.slots && day.slots.length > 0,
  );

  const handleBookingComplete = () => {
    router.push("/student");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4">
      {/* Back Button Section */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 transition-colors"
          asChild
        >
          <Link href="/educators">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Educators
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="md:col-span-1">
          <div className="md:sticky md:top-24">
            <Card className="border-emerald-900/20 bg-emerald-900/20">
              {/* Availability Badge - Top Right */}
              <div className="absolute top-4 right-4 z-10">
                {hasAvailableSlots ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 animate-pulse">
                    ● Available Now
                  </Badge>
                ) : (
                  <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 px-3 py-1">
                    Offline
                  </Badge>
                )}
              </div>

              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-60 h-60 rounded-full overflow-hidden mb-4 bg-emerald-900/20">
                    {educator.imageUrl ? (
                      <Image
                        src={educator.imageUrl}
                        alt={educator.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-16 w-16 text-emerald-400" />
                      </div>
                    )}
                  </div>

                  {/* Header Info */}
                  <div className="text-center space-y-2 mb-6">
                    <h1 className="text-2xl font-bold text-white">
                      {educator.name}
                    </h1>
                    <p className="text-emerald-400 font-medium tracking-wide uppercase text-xs">
                      {educator.specialty} Specialist
                    </p>
                  </div>

                  <div className="flex items-center justify-center mb-2">
                    <Medal className="size-4 text-emerald-400 mr-2" />
                    <span className="text-muted-foreground">
                      {educator.experience} years experience
                    </span>
                  </div>
                  <Separator className="bg-emerald-900/20" />

                  <p className="text-muted-foreground whitespace-pre-line">
                    {educator.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div id="booking-section" className="scroll-mt-24">
            <Card className="border-emerald-900/20 bg-emerald-900/20">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">
                  Book an Appointment
                </CardTitle>
                <CardDescription>
                  {confirmedSlot
                    ? "Review details and confirm"
                    : "Select your preferred date and time"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasAvailableSlots ? (
                  <>
                    {!confirmedSlot ? (
                      <div className="space-y-6">
                        <div className="w-full max-w-4xl bg-[#121212] border border-white/10 rounded-xl p-8 flex flex-col md:flex-row gap-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                          <div className="flex-1">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                if (!date) return;
                                setSelectedDate(date);
                                setTempSelectedSlot(null);
                              }}
                              className="p-0 w-full"
                              classNames={{
                                months: "w-full",
                                month: "space-y-6 w-full",
                                caption:
                                  "flex justify-between items-center mb-4 relative",
                                caption_label:
                                  "text-xl font-semibold text-white",
                                nav: "flex items-center gap-2",
                                nav_button:
                                  "h-8 w-8 bg-[#1a1a1a] border border-white/10 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors text-white",
                                table: "w-full border-collapse",
                                head_row: "flex justify-between mb-4",
                                head_cell:
                                  "text-gray-500 w-10 font-medium text-[12px] uppercase tracking-wider",
                                row: "flex justify-between w-full mt-2",
                                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                                day: "h-12 w-12 p-0 font-normal text-white aria-selected:opacity-100 hover:bg-white/5 rounded-xl transition-all flex flex-col items-center justify-center gap-1",
                                day_selected:
                                  "bg-white !text-black hover:bg-white hover:text-black focus:bg-white focus:text-black rounded-xl",
                                day_today:
                                  "bg-[#222] text-white border border-white/20",
                                day_outside: "text-gray-600 opacity-50",
                              }}
                            />
                          </div>

                          <div className="hidden md:block w-px bg-white/5 self-stretch" />

                          <div className="w-full md:w-[320px] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="font-semibold text-base text-center text-white">
                                {selectedDate
                                  ? format(selectedDate, "EEEE, MMMM do, yyyy")
                                  : "Select a date"}
                              </h3>
                            </div>

                            <div className="space-y-3 overflow-y-auto max-h-75 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                              {availableDays
                                .find((day) =>
                                  isSameDay(
                                    new Date(day.date + "T00:00:00"),
                                    selectedDate,
                                  ),
                                )
                                ?.slots.map((slot, index) => {
                                  const isSelected =
                                    tempSelectedSlot?.startTime ===
                                    slot.startTime;
                                  return (
                                    <Button
                                      key={`${slot.availabilityId}-${index}`}
                                      variant={
                                        isSelected ? "default" : "outline"
                                      }
                                      onClick={() => setTempSelectedSlot(slot)}
                                      className={`w-full py-6 rounded-sm text-md font-medium transition-all ${
                                        isSelected
                                          ? "bg-emerald-500/60 hover:bg-emerald-600 text-white border-none"
                                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/40 text-white"
                                      }`}
                                    >
                                      {format(new Date(slot.startTime), "p")}
                                    </Button>
                                  );
                                })}

                              {!availableDays.some((day) =>
                                isSameDay(day.date, selectedDate),
                              ) && (
                                <p className="text-gray-500 text-sm mt-4 text-center italic">
                                  No slots available for this date.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button
                            disabled={!tempSelectedSlot}
                            onClick={() => setConfirmedSlot(tempSelectedSlot)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Continue to booking
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <AppointmentForm
                        educatorId={educator.id}
                        slot={confirmedSlot}
                        onBack={() => {
                          setConfirmedSlot(null);
                          setTempSelectedSlot(null);
                        }}
                        onComplete={handleBookingComplete}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 bg-[#121212] border border-white/10 rounded-xl">
                    <Calendar1Icon className="size-12 mx-auto text-gray-600 mb-3" />
                    <h3 className="text-xl font-medium text-white mb-2">
                      No available slots
                    </h3>
                    <p className="text-gray-500 max-w-sm mx-auto px-6">
                      This educator doesn&apos;t have any available appointment
                      slots for the selected period.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { Alert, AlertDescription } from "@/app/_components/ui/alert";
// import { Button } from "@/app/_components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/app/_components/ui/card";
// import { Separator } from "@/app/_components/ui/separator";
// import { Calendar1Icon, Medal, User, ArrowRight } from "lucide-react";
// import Image from "next/image";
// import { useState } from "react";
// import AppointmentForm from "./appointment-form";
// import { useRouter } from "next/navigation";
// import { isSameDay, format } from "date-fns";

// import { Badge } from "@/app/_components/ui/badge";
// import { Calendar } from "@/app/_components/ui/calendar";

// type Educator = {
//   id: string;
//   name: string;
//   imageUrl?: string;
//   specialty: string;
//   experience: number | string;
//   description: string;
// };

// interface TimeSlot {
//   startTime: string;
//   endTime: string;
//   formatted: string;
//   day: string;
//   availabilityId: string;
// }

// interface DayWithSlots {
//   date: string;
//   displayDate: string;
//   slots: TimeSlot[];
// }

// interface EducatorProfileProps {
//   educator: Educator;
//   availableDays: DayWithSlots[];
// }

// export default function EducatorProfile({
//   educator,
//   availableDays = [],
// }: EducatorProfileProps) {
//   const [tempSelectedSlot, setTempSelectedSlot] = useState<TimeSlot | null>(
//     null,
//   );
//   // This triggers the actual form view
//   const [confirmedSlot, setConfirmedSlot] = useState<TimeSlot | null>(null);
//   const now = new Date();
//   const router = useRouter();
//   const [selectedDate, setSelectedDate] = useState<Date>(new Date());

//   const hasAvailableSlots = availableDays.some(
//     (day) => day.slots && day.slots.length > 0,
//   );

//   const handleBookingComplete = () => {
//     router.push("/student");
//   };

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//       <div className="md:col-span-1">
//         <div className="md:sticky md:top-24">
//           <Card className="border-emerald-900/20 bg-emerald-900/20">
//             <CardContent className="pt-6">
//               <div className="flex flex-col items-center text-center">
//                 <div className="space-y-4 py-3 w-full">
//                   {hasAvailableSlots ? (
//                     <Alert className="bg-amber-900/20 border-amber-900/50 w-full flex flex-col items-center justify-center text-center">
//                       <AlertDescription className="text-amber-200">
//                         Available for Session Now
//                       </AlertDescription>
//                     </Alert>
//                   ) : (
//                     <Alert className="bg-slate-800 border-amber-900/50 w-full flex flex-col items-center justify-center text-center">
//                       <AlertDescription className="text-amber-200">
//                         Not Available for Session Now
//                       </AlertDescription>
//                     </Alert>
//                   )}
//                 </div>
//                 <div className="relative w-60 h-60 rounded-full overflow-hidden mb-4 bg-emerald-900/20">
//                   {educator.imageUrl ? (
//                     <Image
//                       src={educator.imageUrl}
//                       alt={educator.name}
//                       fill
//                       className="object-cover"
//                     />
//                   ) : (
//                     <div className="w-full h-full flex items-center justify-center">
//                       <User className="h-16 w-16 text-emerald-400" />
//                     </div>
//                   )}
//                 </div>
//                 <Badge
//                   variant="outline"
//                   className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400 mb-4"
//                 >
//                   {educator.specialty}
//                 </Badge>

//                 <div className="flex items-center justify-center mb-2">
//                   <Medal className="size-4 text-emerald-400 mr-2" />
//                   <span className="text-muted-foreground">
//                     {educator.experience} years experience
//                   </span>
//                 </div>
//                 <Separator className="bg-emerald-900/20" />

//                 <p className="text-muted-foreground whitespace-pre-line">
//                   {educator.description}
//                 </p>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>

//       <div className="md:col-span-2 space-y-6">
//         <div id="booking-section" className="scroll-mt-24">
//           <Card className="border-emerald-900/20 bg-emerald-900/20">
//             <CardHeader>
//               <CardTitle className="text-xl font-bold text-white">
//                 Book an Appointment
//               </CardTitle>
//               <CardDescription>
//                 {confirmedSlot
//                   ? "Review details and confirm"
//                   : "Select your preferred date and time"}
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               {hasAvailableSlots ? (
//                 <>
//                   {!confirmedSlot ? (
//                     <div className="space-y-6">
//                       <div className="w-full max-w-4xl bg-[#121212] border border-white/10 rounded-xl p-8 flex flex-col md:flex-row gap-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
//                         <div className="flex-1">
//                           <Calendar
//                             mode="single"
//                             selected={selectedDate}
//                             onSelect={(date) => {
//                               if (!date) return;
//                               setSelectedDate(date);
//                               setTempSelectedSlot(null); // Reset slot if date changes
//                             }}
//                             className="p-0 w-full"
//                             classNames={{
//                               months: "w-full",
//                               month: "space-y-6 w-full",
//                               caption:
//                                 "flex justify-between items-center mb-4 relative",
//                               caption_label: "text-xl font-semibold text-white",
//                               nav: "flex items-center gap-2",
//                               nav_button:
//                                 "h-8 w-8 bg-[#1a1a1a] border border-white/10 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors text-white",
//                               table: "w-full border-collapse",
//                               head_row: "flex justify-between mb-4",
//                               head_cell:
//                                 "text-gray-500 w-10 font-medium text-[12px] uppercase tracking-wider",
//                               row: "flex justify-between w-full mt-2",
//                               cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
//                               day: "h-12 w-12 p-0 font-normal text-white aria-selected:opacity-100 hover:bg-white/5 rounded-xl transition-all flex flex-col items-center justify-center gap-1",
//                               day_selected:
//                                 "bg-white !text-black hover:bg-white hover:text-black focus:bg-white focus:text-black rounded-xl",
//                               day_today:
//                                 "bg-[#222] text-white border border-white/20",
//                               day_outside: "text-gray-600 opacity-50",
//                             }}
//                           />
//                         </div>

//                         <div className="hidden md:block w-px bg-white/5 self-stretch" />

//                         <div className="w-full md:w-[320px] flex flex-col">
//                           <div className="flex justify-between items-center mb-6">
//                             <h3 className="font-semibold text-base text-center text-white">
//                               {selectedDate
//                                 ? format(selectedDate, "EEEE, MMMM do, yyyy")
//                                 : "Select a date"}
//                             </h3>
//                           </div>

//                           <div className="space-y-3 overflow-y-auto max-h-75 pr-2 scrollbar-thin scrollbar-thumb-white/10">
//                             {availableDays
//                               .find((day) =>
//                                 isSameDay(
//                                   new Date(day.date + "T00:00:00"),
//                                   selectedDate,
//                                 ),
//                               )
//                               ?.slots.map((slot, index) => {
//                                 const isSelected =
//                                   tempSelectedSlot?.startTime ===
//                                   slot.startTime;
//                                 return (
//                                   <Button
//                                     key={`${slot.availabilityId}-${index}`}
//                                     variant={isSelected ? "default" : "outline"}
//                                     onClick={() => setTempSelectedSlot(slot)}
//                                     className={`w-full py-6 rounded-sm text-md font-medium transition-all ${
//                                       isSelected
//                                         ? "bg-emerald-500/60 hover:bg-emerald-600 text-white border-none"
//                                         : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/40 text-white"
//                                     }`}
//                                   >
//                                     {format(new Date(slot.startTime), "p")}
//                                   </Button>
//                                 );
//                               })}

//                             {!availableDays.some((day) =>
//                               isSameDay(day.date, selectedDate),
//                             ) && (
//                               <p className="text-gray-500 text-sm mt-4 text-center italic">
//                                 No slots available for this date.
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                       </div>

//                       {/* THE ACTION BUTTON */}
//                       <div className="flex justify-end pt-4">
//                         <Button
//                           disabled={!tempSelectedSlot}
//                           onClick={() => setConfirmedSlot(tempSelectedSlot)}
//                           className="bg-emerald-600 hover:bg-emerald-700"
//                         >
//                           Continue to booking
//                           <ArrowRight className="ml-2 h-5 w-5" />
//                         </Button>
//                       </div>
//                     </div>
//                   ) : (
//                     <AppointmentForm
//                       educatorId={educator.id}
//                       slot={confirmedSlot}
//                       onBack={() => {
//                         setConfirmedSlot(null);
//                         setTempSelectedSlot(null);
//                       }}
//                       onComplete={handleBookingComplete}
//                     />
//                   )}
//                 </>
//               ) : (
//                 <div className="text-center py-20 bg-[#121212] border border-white/10 rounded-xl">
//                   <Calendar1Icon className="size-12 mx-auto text-gray-600 mb-3" />
//                   <h3 className="text-xl font-medium text-white mb-2">
//                     No available slots
//                   </h3>
//                   <p className="text-gray-500 max-w-sm mx-auto px-6">
//                     This educator doesn&apos;t have any available appointment
//                     slots for the selected period.
//                   </p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }
