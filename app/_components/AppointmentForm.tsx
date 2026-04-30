"use client";

import { useTransition } from "react";
import { Button } from "@/app/_components/ui/button";
import { Label } from "@/app/_components/ui/label";
import { Textarea } from "@/app/_components/ui/textarea";
import { bookAppointment } from "@/app/actions/appointments";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Define the shape of the slot object
interface Slot {
  startTime: string;
  endTime: string;
  availabilityId: string;
  formatted: string;
}

// Define the component props
interface AppointmentFormProps {
  educatorId: string;
  slot: Slot;
  onBack: () => void;
  onComplete: () => void;
}

export default function AppointmentForm({
  educatorId,
  slot,
  onBack,
  onComplete,
}: AppointmentFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Append hidden fields needed by the server action
    formData.append("educatorId", educatorId);
    formData.append("startTime", slot.startTime);
    formData.append("endTime", slot.endTime);
    formData.append("availabilityId", slot.availabilityId);

    startTransition(async () => {
      try {
        const res = await bookAppointment(formData);

        if (res.success) {
          toast.success("Appointment booked successfully!");
          onComplete();
        } else {
          toast.error("Failed to book appointment");
        }
      } catch (error) {
        toast.error("An unexpected error occurred" + error);
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 space-y-3">
        <div className="flex items-center">
          <Calendar className="size-5 text-emerald-400 mr-2" />
          <span className="text-white font-medium">
            {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
          </span>
        </div>

        <div className="flex items-center">
          <Clock className="size-5 text-emerald-400 mr-2" />
          <span className="text-white">{slot.formatted}</span>
        </div>

        <div className="space-y-4">
          <Label htmlFor="description">
            Describe the lesson or class support (optional)
          </Label>
          <Textarea
            id="description"
            name="description" // Added name attribute for FormData
            placeholder="Details about the lesson..."
            className="bg-background border-emerald-900/20 h-32"
            disabled={isPending}
          />
        </div>

        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isPending}
            className="border-emerald-900/30"
          >
            <ArrowLeft className="mr-2 size-4" />
            Change Time
          </Button>

          <Button
            type="submit"
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 min-w-35"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Booking...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

// "use client";

// import { Button } from "@/app/_components/ui/button";
// import { Label } from "@/app/_components/ui/label";
// import { Textarea } from "@/app/_components/ui/textarea";
// import { bookAppointment } from "@/app/actions/appointments";
// import useFetch from "@/hooks/use-fetch";
// import { format } from "date-fns";
// import { ArrowLeft, Calendar, Clock, Loader2 } from "lucide-react";
// import { useEffect, useState } from "react";
// import { toast } from "sonner";

// export default function AppointmentForm({
//   educatorId,
//   slot,
//   onBack,
//   onComplete,
// }) {
//   const [description, setDescription] = useState("");

//   const { loading, data, fn: submitBooking } = useFetch(bookAppointment);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const formData = new FormData();
//     formData.append("educatorId", educatorId);
//     formData.append("startTime", slot.startTime);
//     formData.append("endTime", slot.endTime);
//     formData.append("description", description);
//     formData.append("availabilityId", slot.availabilityId);

//     await submitBooking(formData);
//   };

//   useEffect(() => {
//     if (data?.success) {
//       toast.success("Appointment booked successfully");
//       onComplete();
//     } else if (data?.error) {
//       toast.error(data.error);
//     }
//   }, [data, onComplete]);

//   return (
//     <form className="space-y-6" onSubmit={handleSubmit}>
//       <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 space-y-3">
//         <div className="flex items-center">
//           <Calendar className="size-5 text-emerald-400 mr-2" />
//           <span className="text-white font-medium">
//             {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
//           </span>
//         </div>

//         <div className="flex items-center">
//           <Clock className="size-5 text-emerald-400 mr-2" />
//           <span className="text-white">{slot.formatted}</span>
//         </div>

//         <div className="space-y-4">
//           <Label htmlFor="description">
//             Describe the lesson or class support that you want (optional)
//           </Label>
//           <Textarea
//             id="description"
//             placeholder="Please provide any details about the lesson or topics you need help with"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             className="bg-background border-emerald-900/20 h-32"
//           />
//           <p className="text-sm text-muted-foreground">
//             This information will be shared with your tutor before your session
//           </p>
//         </div>

//         <div className="flex justify-between pt-2">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={onBack}
//             disabled={loading}
//             className="border-emerald-900/30"
//           >
//             <ArrowLeft className="mr-2 size-4" />
//             Change Time Slot
//           </Button>

//           <Button
//             type="submit"
//             disabled={loading}
//             className="bg-emerald-600 hover:bg-emerald-700"
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="mr-2 size-4 animate-spin" />
//                 Booking...
//               </>
//             ) : (
//               "Confirm Booking"
//             )}
//           </Button>
//         </div>
//       </div>
//     </form>
//   );
// }
