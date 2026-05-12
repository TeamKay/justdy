"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  EyeIcon,
  GraduationCap,
  Loader2,
  User,
  Video,
  X,
} from "lucide-react";

import useFetch from "@/hooks/use-fetch";

import {
  addAppointmentNotes,
  cancelAppointment,
  markAppointmentCompleted,
} from "../actions/educator";

import { generateVideoToken } from "../actions/appointments";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type User = {
  id: string;
  name: string;
  email?: string | null;
  specialty?: string | null;
};

type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";

type Appointment = {
  id: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
  status: AppointmentStatus;
  notes: string | null;
  studentDescription: string | null;
  student: User;
  educator: User;
};

type AppointmentsTableProps = {
  appointments?: Appointment[];
  userRole: "Educator" | "Student";
};

export default function AppointmentsTable({
  appointments = [],
  userRole,
}: AppointmentsTableProps) {
  const router = useRouter();

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [open, setOpen] = useState(false);

  const [action, setAction] = useState<"video" | "notes" | null>(null);

  const [notes, setNotes] = useState("");

  // ---------------- API Hooks ----------------

  const {
    loading: cancelLoading,
    fn: submitCancel,
    // data: cancelData,
  } = useFetch(cancelAppointment);

  const {
    loading: notesLoading,
    fn: submitNotes,
    // data: notesData,
  } = useFetch(addAppointmentNotes);

  const {
    loading: tokenLoading,
    fn: submitTokenRequest,
    data: tokenData,
  } = useFetch(generateVideoToken);

  const {
    loading: completeLoading,
    fn: submitMarkComplete,
    // data: completeData,
  } = useFetch(markAppointmentCompleted);

  // ---------------- Helpers ----------------

  const formatDateTime = (date: Date) => {
    try {
      return format(new Date(date), "MMMM d, yyyy 'at' h:mm a");
    } catch {
      return "Invalid date";
    }
  };

  const formatDate = (date: Date) => {
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (date: Date) => {
    try {
      return format(new Date(date), "h:mm a");
    } catch {
      return "Invalid time";
    }
  };

  const isAppointmentActive = (appointment: Appointment) => {
    const now = new Date();

    const start = new Date(appointment.startTime);

    const end = new Date(appointment.endTime);

    return (
      (start.getTime() - now.getTime() <= 30 * 60 * 1000 && now < start) ||
      (now >= start && now <= end)
    );
  };

  const canMarkCompleted = (appointment: Appointment) => {
    return userRole === "Educator" && appointment.status === "Scheduled";
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "Completed":
        return (
          <Badge className="bg-emerald-900/20 text-emerald-400 border border-emerald-700/20">
            Completed
          </Badge>
        );

      case "Cancelled":
        return (
          <Badge className="bg-red-900/20 text-red-400 border border-red-700/20">
            Cancelled
          </Badge>
        );

      default:
        return (
          <Badge className="bg-amber-900/20 text-amber-400 border border-amber-700/20">
            Scheduled
          </Badge>
        );
    }
  };

  // ---------------- Selected Appointment ----------------

  const otherParty = useMemo(() => {
    if (!selectedAppointment) return null;

    return userRole === "Educator"
      ? selectedAppointment.student
      : selectedAppointment.educator;
  }, [selectedAppointment, userRole]);

  // const otherPartyLabel = userRole === "Educator" ? "Student" : "Educator";

  // ---------------- Actions ----------------

  const handleOpenDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);

    setNotes(appointment.notes || "");

    setOpen(true);
  };

  const handleJoinVideoCall = async () => {
    if (!selectedAppointment || tokenLoading) return;

    setAction("video");

    const formData = new FormData();

    formData.append("appointmentId", selectedAppointment.id);

    await submitTokenRequest(formData);
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment || notesLoading || userRole !== "Educator") return;

    const formData = new FormData();
    formData.append("appointmentId", selectedAppointment.id);
    formData.append("notes", notes);

    const result = await submitNotes(formData);
    // Handle success directly here instead of useEffect
    if (result?.success) {
      toast.success("Notes saved successfully");
      setAction(null);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment || cancelLoading) return;

    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      const formData = new FormData();
      formData.append("appointmentId", selectedAppointment.id);
      const result = await submitCancel(formData);
      if (result?.success) {
        toast.success("Appointment cancelled");
        setOpen(false);
      }
    }
  };

  const handleMarkCompleted = async () => {
    if (!selectedAppointment || completeLoading) return;

    if (
      window.confirm(
        "Are you sure you want to mark this appointment as completed?",
      )
    ) {
      const formData = new FormData();
      formData.append("appointmentId", selectedAppointment.id);

      const result = await submitMarkComplete(formData);
      if (result?.success) {
        toast.success("Appointment marked completed");
        setOpen(false);
      }
    }
  };

  // ---------------- Effects ----------------

  useEffect(() => {
    if (tokenData?.success && selectedAppointment) {
      router.push(
        `/video-call?sessionId=${tokenData.videoSessionId}&token=${tokenData.token}&appointmentId=${selectedAppointment.id}`,
      );
    }
  }, [tokenData, selectedAppointment, router]);

  return (
    <>
      <div className="rounded-md border border-emerald-900/20 overflow-hidden bg-black/20 backdrop-blur-md">
        <Table>
          <TableHeader className="bg-emerald-950/30">
            <TableRow className="border-emerald-900/20 hover:bg-transparent">
              <TableHead className="text-white">
                {userRole === "Educator" ? "Student" : "Educator"}
              </TableHead>

              <TableHead className="text-white">Date</TableHead>

              <TableHead className="text-white">Time</TableHead>

              <TableHead className="text-white">Status</TableHead>

              <TableHead className="text-white">Video</TableHead>

              <TableHead className="text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  No appointments found
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => {
                const otherParty =
                  userRole === "Educator"
                    ? appointment.student
                    : appointment.educator;

                return (
                  <TableRow
                    key={appointment.id}
                    className="border-emerald-900/10 hover:bg-emerald-950/10"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-900/20 p-2 rounded-full">
                          {userRole === "Educator" ? (
                            <User className="size-4 text-emerald-400" />
                          ) : (
                            <GraduationCap className="size-4 text-emerald-400" />
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-white">
                            {otherParty.name}
                          </p>

                          {userRole === "Educator" ? (
                            <p className="text-xs text-muted-foreground">
                              {otherParty.email}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {otherParty.specialty}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {formatDate(appointment.startTime)}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {formatTime(appointment.startTime)} -{" "}
                      {formatTime(appointment.endTime)}
                    </TableCell>

                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>

                    <TableCell>
                      {appointment.status === "Scheduled" ? (
                        isAppointmentActive(appointment) ? (
                          <Badge className="bg-emerald-900/20 text-emerald-400 border border-emerald-700/20">
                            Available
                          </Badge>
                        ) : (
                          <Badge className="bg-muted/20 text-muted-foreground">
                            Upcoming
                          </Badge>
                        )
                      ) : (
                        <Badge className="bg-muted/20 text-muted-foreground">
                          Closed
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-900/30 hover:bg-emerald-900/20"
                        onClick={() => handleOpenDetails(appointment)}
                      >
                        <EyeIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* DETAILS DIALOG */}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          {selectedAppointment && otherParty && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-white">
                  Appointment Details
                </DialogTitle>

                <DialogDescription>
                  Manage and review appointment information
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* USER INFO */}

                <div className="rounded-xl border border-emerald-900/20 bg-emerald-950/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-900/20 p-3 rounded-full">
                      {userRole === "Educator" ? (
                        <User className="size-5 text-emerald-400" />
                      ) : (
                        <GraduationCap className="size-5 text-emerald-400" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-white font-semibold">
                        {otherParty.name}
                      </h3>

                      {userRole === "Educator" ? (
                        <p className="text-muted-foreground text-sm">
                          {otherParty.email}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          {otherParty.specialty}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* DATE */}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-emerald-900/20 p-4 bg-background/40">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="size-4 text-emerald-400" />

                      <h4 className="text-sm font-medium text-muted-foreground">
                        Appointment Date
                      </h4>
                    </div>

                    <p className="text-white">
                      {formatDateTime(selectedAppointment.startTime)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-900/20 p-4 bg-background/40">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="size-4 text-emerald-400" />

                      <h4 className="text-sm font-medium text-muted-foreground">
                        Status
                      </h4>
                    </div>

                    {getStatusBadge(selectedAppointment.status)}
                  </div>
                </div>

                {/* DESCRIPTION */}

                {selectedAppointment.studentDescription && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {userRole === "Educator"
                        ? "Student Description"
                        : "Your Description"}
                    </h4>

                    <div className="rounded-xl border border-emerald-900/20 p-4 bg-background/40">
                      <p className="text-white whitespace-pre-line">
                        {selectedAppointment.studentDescription}
                      </p>
                    </div>
                  </div>
                )}

                {/* VIDEO */}

                {selectedAppointment.status === "Scheduled" && (
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={
                      !isAppointmentActive(selectedAppointment) ||
                      action === "video" ||
                      tokenLoading
                    }
                    onClick={handleJoinVideoCall}
                  >
                    {tokenLoading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Preparing Video Call...
                      </>
                    ) : (
                      <>
                        <Video className="size-4 mr-2" />
                        {isAppointmentActive(selectedAppointment)
                          ? "Join Video Call"
                          : "Available 30 mins before appointment"}
                      </>
                    )}
                  </Button>
                )}

                {/* NOTES */}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Educator Notes
                    </h4>

                    {userRole === "Educator" &&
                      action !== "notes" &&
                      selectedAppointment.status !== "Cancelled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAction("notes")}
                        >
                          <Edit className="size-4 mr-1" />
                          {selectedAppointment.notes ? "Edit" : "Add"}
                        </Button>
                      )}
                  </div>

                  {userRole === "Educator" && action === "notes" ? (
                    <div className="space-y-3">
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Enter notes..."
                        className="min-h-32"
                      />

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setAction(null)}
                        >
                          Cancel
                        </Button>

                        <Button
                          onClick={handleSaveNotes}
                          disabled={notesLoading}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {notesLoading ? (
                            <>
                              <Loader2 className="size-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Notes"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-900/20 p-4 bg-background/40 min-h-24">
                      {selectedAppointment.notes ? (
                        <p className="text-white whitespace-pre-line">
                          {selectedAppointment.notes}
                        </p>
                      ) : (
                        <p className="italic text-muted-foreground">
                          No notes added yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER */}

              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between">
                {selectedAppointment.status === "Scheduled" && (
                  <Button
                    variant="outline"
                    onClick={handleCancelAppointment}
                    disabled={cancelLoading}
                    className="border-red-900/30 text-red-400 hover:bg-red-900/10"
                  >
                    {cancelLoading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X className="size-4 mr-1" />
                        Cancel Appointment
                      </>
                    )}
                  </Button>
                )}

                {canMarkCompleted(selectedAppointment) && (
                  <Button
                    onClick={handleMarkCompleted}
                    disabled={completeLoading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {completeLoading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="size-4 mr-1" />
                        Mark Completed
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { format } from "date-fns";
// import { toast } from "sonner";
// import {
//   Calendar,
//   CheckCircle,
//   Clock,
//   Edit,
//   GraduationCap,
//   Loader2,
//   User,
//   Video,
//   X,
// } from "lucide-react";

// import useFetch from "@/hooks/use-fetch";
// import {
//   addAppointmentNotes,
//   cancelAppointment,
//   markAppointmentCompleted,
// } from "../actions/educator";
// import { generateVideoToken } from "../actions/appointments";

// import { Card, CardContent } from "./ui/card";
// import { Badge } from "./ui/badge";
// import { Button } from "./ui/button";
// import { Textarea } from "./ui/textarea";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "./ui/dialog";

// type User = {
//   id: string;
//   name: string;
//   email?: string | null;
//   specialty?: string | null;
// };

// type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";

// type Appointment = {
//   id: string;
//   startTime: Date;
//   endTime: Date;
//   createdAt: Date;
//   updatedAt: Date;
//   status: AppointmentStatus;
//   notes: string | null;
//   studentDescription: string | null;
//   student: User;
//   educator: User;
// };

// type AppointmentCardProps = {
//   appointment: Appointment;
//   userRole: "Educator" | "Student";
// };

// export default function AppointmentCard({
//   appointment,
//   userRole,
// }: AppointmentCardProps) {
//   const [open, setOpen] = useState(false);

//   const [action, setAction] = useState<"video" | "notes" | null>(null);
//   const [notes, setNotes] = useState(appointment.notes || "");
//   const router = useRouter();

//   // --- API Hooks ---
//   const {
//     loading: cancelLoading,
//     fn: submitCancel,
//     data: cancelData,
//   } = useFetch(cancelAppointment);

//   const {
//     loading: notesLoading,
//     fn: submitNotes,
//     data: notesData,
//   } = useFetch(addAppointmentNotes);

//   const {
//     loading: tokenLoading,
//     fn: submitTokenRequest,
//     data: tokenData,
//   } = useFetch(generateVideoToken);

//   const {
//     loading: completeLoading,
//     fn: submitMarkComplete,
//     data: completeData,
//   } = useFetch(markAppointmentCompleted);

//   // --- Derived State ---
//   const otherParty =
//     userRole === "Educator" ? appointment.student : appointment.educator;
//   const otherPartyLabel = userRole === "Educator" ? "Student" : "Educator";
//   const otherPartyIcon = userRole === "Educator" ? <User /> : <GraduationCap />;

//   // --- Helper Functions ---
//   const formatDateTime = (date: Date) => {
//     try {
//       return format(date, "MMMM d, yyyy 'at' h:mm a");
//     } catch (e) {
//       return "invalid date" + e;
//     }
//   };

//   const formatTime = (date: Date) => {
//     try {
//       return format(date, "h:mm a");
//     } catch (e) {
//       return "Invalid time" + e;
//     }
//   };

//   const canMarkCompleted = () => {
//     return userRole === "Educator" && appointment.status === "Scheduled";
//   };

//   const isAppointmentActive = () => {
//     const now = new Date();
//     const appointmentTime = new Date(appointment.startTime);
//     const appointmentEndTime = new Date(appointment.endTime);

//     return (
//       (appointmentTime.getTime() - now.getTime() <= 30 * 60 * 1000 &&
//         now < appointmentTime) ||
//       (now >= appointmentTime && now <= appointmentEndTime)
//     );
//   };

//   // --- Event Handlers ---
//   const handleMarkCompleted = async () => {
//     if (completeLoading) return;
//     if (
//       window.confirm(
//         "Are you sure you want to mark this appointment as complete? thia action cannot be undone",
//       )
//     ) {
//       const formData = new FormData();
//       formData.append("appointmentId", appointment.id);
//       await submitMarkComplete(formData);
//     }
//   };

//   const handleJoinVideoCall = async () => {
//     if (tokenLoading) return;
//     setAction("video");
//     const formData = new FormData();
//     formData.append("appointmentId", appointment.id);
//     await submitTokenRequest(formData);
//   };

//   const handleSaveNotes = async () => {
//     if (notesLoading || userRole !== "Educator") return;
//     const formData = new FormData();
//     formData.append("appointmentId", appointment.id);
//     formData.append("notes", notes);
//     await submitNotes(formData);
//   };

//   const handleCancelAppointment = async () => {
//     if (cancelLoading) return;
//     if (
//       window.confirm(
//         "Are you sure you want to cancel this appointment? this action cannot be undone",
//       )
//     ) {
//       const formData = new FormData();
//       formData.append("appointmentId", appointment.id);
//       await submitCancel(formData);
//     }
//   };

//   // --- Effects ---
//   const notesSuccess = notesData?.success;
//   useEffect(() => {
//     if (!notesSuccess) return;

//     toast.success("Appointment marked as completed");
//     setTimeout(() => {
//       setOpen(false);
//     }, 0);
//   }, [notesSuccess]);

//   useEffect(() => {
//     if (tokenData?.success) {
//       router.push(
//         `/video-call?sessionId=${tokenData.videoSessionId}&token=${tokenData.token}&appointmentId=${appointment.id}`,
//       );
//     }
//   }, [tokenData, appointment.id, router]);

//   useEffect(() => {
//     if (!notesSuccess) return;

//     toast.success("Notes saved successfully");
//     setTimeout(() => {
//       setAction(null);
//     }, 0);
//   }, [notesSuccess]);

//   const cancelSuccess = cancelData?.success;
//   useEffect(() => {
//     if (!cancelSuccess) return;

//     toast.success("Appointment canceled successfully");
//     setTimeout(() => {
//       setOpen(false);
//     }, 0);
//   }, [cancelSuccess]);

//   const completeSuccess = completeData?.success;
//   useEffect(() => {
//     if (!completeSuccess) return;

//     toast.success("Appointment completed successfully");
//     setTimeout(() => {
//       setOpen(false);
//     }, 0);
//   }, [completeSuccess]);

//   const getBackgroundColor = () => {
//     switch (appointment.status) {
//       case "Completed":
//         return "bg-emerald-950/20 border-emerald-900/20 opacity-80"; // Muted green
//       case "Cancelled":
//         return "bg-red-950/10 border-red-900/20 grayscale-[0.5] opacity-70"; // Faded red/grey
//       default:
//         return "bg-emerald-900/20 border-emerald-900/10"; // Standard for Scheduled
//     }
//   };

//   return (
//     <>
//       <Card
//         className={`transition-all ${getBackgroundColor()} ${
//           appointment.status === "Scheduled"
//             ? "hover:border-emerald-700/30"
//             : "hover:border-white/10"
//         }`}
//       >
//         <CardContent className="p-4">
//           <div className="flex flex-col md:flex-row justify-between gap-4">
//             <div className="flex items-start gap-3">
//               <div className="bg-muted/20 rounded-cull p-2 mt-1">
//                 {otherPartyIcon}
//               </div>
//               <div>
//                 <h3 className="font-medium text-white">
//                   {userRole === "Educator"
//                     ? otherParty.name
//                     : `${otherParty.name}`}
//                 </h3>

//                 {userRole === "Educator" && (
//                   <p className="text-sm text-muted-foreground">
//                     {otherParty.email}
//                   </p>
//                 )}

//                 {userRole === "Student" && (
//                   <p className="text-sm text-muted-foreground">
//                     {otherParty.specialty}
//                   </p>
//                 )}

//                 <div className="flex items-center mt-2 text-sm text-muted-foreground">
//                   <Calendar className="size-4 mr-1" />
//                   <span>{formatDateTime(appointment.startTime)}</span>
//                 </div>

//                 <div className="flex items-center mt-1 text-sm text-muted-foreground">
//                   <Clock className="size-4 mr-1" />
//                   <span>
//                     {formatTime(appointment.startTime)} -{" "}
//                     {formatTime(appointment.endTime)}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-col gap-2 self-end md:self-start">
//               <Badge
//                 variant="outline"
//                 className={
//                   appointment.status === "Completed"
//                     ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400 self-start"
//                     : appointment.status === "Cancelled"
//                       ? "bg-red-900/20 border-red-900/30 text-red-400 self-start"
//                       : "bg-amber-900/20 border-r-amber-900/30 text-amber-400 self-start"
//                 }
//               >
//                 {appointment.status}
//               </Badge>

//               <div className="flex gap-2 mt-2 flex-wrap">
//                 {canMarkCompleted() && (
//                   <Button
//                     onClick={handleMarkCompleted}
//                     disabled={completeLoading}
//                     size="sm"
//                     className="bg-emerald-600 hover:bg-emerald-700"
//                   >
//                     {completeLoading ? (
//                       <Loader2 className="size-4 animate-spin" />
//                     ) : (
//                       <>
//                         <CheckCircle className="size-4 mr-1" />
//                         Complete
//                       </>
//                     )}
//                   </Button>
//                 )}

//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="border-emerald-900/30"
//                   onClick={() => setOpen(true)}
//                 >
//                   View Details
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <Dialog open={open} onOpenChange={setOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle className="text-xl font-bold text-white">
//               Appointment Details
//             </DialogTitle>
//             <DialogDescription>
//               {appointment.status === "Scheduled"
//                 ? "Manage your upcoming appointment"
//                 : "View appointment information"}
//             </DialogDescription>
//           </DialogHeader>

//           <div className="space-y-4 py-4">
//             <div className="space-y-2">
//               <h4 className="text-sm font-medium text-muted-foreground">
//                 {otherPartyLabel}
//               </h4>
//               <div className="flex items-center">
//                 <div className="size-5 text-emerald-400 mr-2">
//                   {otherPartyIcon}
//                 </div>
//                 <div>
//                   <p className="text-white font-medium">
//                     {userRole === "Educator"
//                       ? otherParty.name
//                       : ` ${otherParty.name}`}
//                   </p>
//                   {userRole === "Educator" && (
//                     <p className="text-muted-foreground text-sm">
//                       {otherParty.email}
//                     </p>
//                   )}
//                   {userRole === "Student" && (
//                     <p className="text-muted-foreground text-sm">
//                       {otherParty.specialty}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <h4 className="text-sm font-medium text-muted-foreground">
//                 Scheduled Time
//               </h4>
//               <div className="flex flex-col gap-1">
//                 <div className="flex items-center">
//                   <Calendar className=" size-5 text-emerald-400 mr-2" />
//                   <p className="text-white">
//                     {formatDateTime(appointment.startTime)}
//                   </p>
//                 </div>
//                 <div className="flex items-center">
//                   <Clock className="size-5 text-emerald-400 mr-2" />
//                   <p className="text-white">
//                     {formatTime(appointment.startTime)} -{" "}
//                     {formatTime(appointment.endTime)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <h4 className="text-sm font-medium text-muted-foreground">
//                 Status
//               </h4>
//               <Badge
//                 variant="outline"
//                 className={
//                   appointment.status === "Completed"
//                     ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400 self-start"
//                     : appointment.status === "Cancelled"
//                       ? "bg-red-900/20 border-red-900/30 text-red-400 self-start"
//                       : "bg-amber-900/20 border-r-amber-900/30 text-amber-400 self-start"
//                 }
//               >
//                 {appointment.status}
//               </Badge>
//             </div>

//             {appointment.studentDescription && (
//               <div className="space-y-2">
//                 <h4 className="text-sm font-medium text-muted-foreground">
//                   {userRole === "Educator"
//                     ? "Student Description"
//                     : "Your Description"}
//                 </h4>
//                 <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20">
//                   <p className="text-white whitespace-pre-line">
//                     {appointment.studentDescription}
//                   </p>
//                 </div>
//               </div>
//             )}

//             {appointment.status === "Scheduled" && (
//               <div className="space-y-2">
//                 <h4 className="text-sm font-medium text-muted-foreground">
//                   Video Session
//                 </h4>

//                 <Button
//                   className="w-full bg-emerald-600 hover:bg-emerald-700"
//                   disabled={
//                     !isAppointmentActive() || action === "video" || tokenLoading
//                   }
//                   onClick={handleJoinVideoCall}
//                 >
//                   {tokenLoading || action === "video" ? (
//                     <>
//                       <Loader2 className="mr-2 size-4 animate-spin" />
//                       Preparing Video Call...
//                     </>
//                   ) : (
//                     <>
//                       <Video className="size-4 mr-2" />
//                       {isAppointmentActive()
//                         ? "Join Video Call"
//                         : "Video Call will be available 30 minutes before appointment"}
//                     </>
//                   )}
//                 </Button>
//               </div>
//             )}

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <h4 className="text-sm font-medium text-muted-foreground">
//                   Educator Notes
//                 </h4>

//                 {userRole === "Educator" &&
//                   action !== "notes" &&
//                   appointment.status !== "Cancelled" && (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => setAction("notes")}
//                       className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
//                     >
//                       <Edit className="size-3.5 mr-1" />
//                       {appointment.notes ? "Edit" : "Add"}
//                     </Button>
//                   )}
//               </div>

//               {userRole === "Educator" && action === "notes" ? (
//                 <div className="space-y-3">
//                   <Textarea
//                     value={notes}
//                     onChange={(e) => setNotes(e.target.value)}
//                     placeholder="Enter your notes here..."
//                     className="bg-background border-emerald-900/20 min-h-25"
//                   />
//                   <div className="flex justify-end space-x-2">
//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="sm"
//                       onClick={() => {
//                         setAction(null);
//                         setNotes(appointment.notes || "");
//                       }}
//                       disabled={notesLoading}
//                       className="border-emerald-900/30"
//                     >
//                       Cancel
//                     </Button>

//                     <Button
//                       size="sm"
//                       onClick={handleSaveNotes}
//                       disabled={notesLoading}
//                       className="bg-emerald-600 hover:bg-emerald-700"
//                     >
//                       {notesLoading ? (
//                         <>
//                           <Loader2 className="mr-2 size-3.5 animate-spin" />
//                           Saving...
//                         </>
//                       ) : (
//                         "Save Notes"
//                       )}
//                     </Button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20 min-h-20">
//                   {appointment.notes ? (
//                     <p className="text-white whitespace-pre-line">
//                       {appointment.notes}
//                     </p>
//                   ) : (
//                     <p className="text-muted-foreground italic">
//                       No notes added yet
//                     </p>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>

//           <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
//             {appointment.status === "Scheduled" && (
//               <Button
//                 variant="outline"
//                 onClick={handleCancelAppointment}
//                 disabled={cancelLoading}
//                 className="border-red-900/30 text-red-400 hover:bg-red-900/10 mt-3 sm:mt-0"
//               >
//                 {cancelLoading ? (
//                   <>
//                     <Loader2 className="mr-2 size-4 animate-spin" />
//                     Cancelling...
//                   </>
//                 ) : (
//                   <>
//                     <X className="size-4 mr-1" />
//                     Cancel Appointment
//                   </>
//                 )}
//               </Button>
//             )}
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }
