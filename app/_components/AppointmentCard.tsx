"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
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

import { Card, CardContent } from "./ui/card";
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

type AppointmentCardProps = {
  appointment: Appointment;
  userRole: "Educator" | "Student";
};

export default function AppointmentCard({
  appointment,
  userRole,
}: AppointmentCardProps) {
  const [open, setOpen] = useState(false);

  const [action, setAction] = useState<"video" | "notes" | null>(null);
  const [notes, setNotes] = useState(appointment.notes || "");
  const router = useRouter();

  // --- API Hooks ---
  const {
    loading: cancelLoading,
    fn: submitCancel,
    data: cancelData,
  } = useFetch(cancelAppointment);

  const {
    loading: notesLoading,
    fn: submitNotes,
    data: notesData,
  } = useFetch(addAppointmentNotes);

  const {
    loading: tokenLoading,
    fn: submitTokenRequest,
    data: tokenData,
  } = useFetch(generateVideoToken);

  const {
    loading: completeLoading,
    fn: submitMarkComplete,
    data: completeData,
  } = useFetch(markAppointmentCompleted);

  // --- Derived State ---
  const otherParty =
    userRole === "Educator" ? appointment.student : appointment.educator;
  const otherPartyLabel = userRole === "Educator" ? "Student" : "Educator";
  const otherPartyIcon = userRole === "Educator" ? <User /> : <GraduationCap />;

  // --- Helper Functions ---
  const formatDateTime = (date: Date) => {
    try {
      return format(date, "MMMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return "invalid date" + e;
    }
  };

  const formatTime = (date: Date) => {
    try {
      return format(date, "h:mm a");
    } catch (e) {
      return "Invalid time" + e;
    }
  };

  const canMarkCompleted = () => {
    return userRole === "Educator" && appointment.status === "Scheduled";
  };

  const isAppointmentActive = () => {
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const appointmentEndTime = new Date(appointment.endTime);

    return (
      (appointmentTime.getTime() - now.getTime() <= 30 * 60 * 1000 &&
        now < appointmentTime) ||
      (now >= appointmentTime && now <= appointmentEndTime)
    );
  };

  // --- Event Handlers ---
  const handleMarkCompleted = async () => {
    if (completeLoading) return;
    if (
      window.confirm(
        "Are you sure you want to mark this appointment as complete? thia action cannot be undone",
      )
    ) {
      const formData = new FormData();
      formData.append("appointmentId", appointment.id);
      await submitMarkComplete(formData);
    }
  };

  const handleJoinVideoCall = async () => {
    if (tokenLoading) return;
    setAction("video");
    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    await submitTokenRequest(formData);
  };

  const handleSaveNotes = async () => {
    if (notesLoading || userRole !== "Educator") return;
    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    formData.append("notes", notes);
    await submitNotes(formData);
  };

  const handleCancelAppointment = async () => {
    if (cancelLoading) return;
    if (
      window.confirm(
        "Are you sure you want to cancel this appointment? this action cannot be undone",
      )
    ) {
      const formData = new FormData();
      formData.append("appointmentId", appointment.id);
      await submitCancel(formData);
    }
  };

  // --- Effects ---
  const notesSuccess = notesData?.success;
  useEffect(() => {
    if (!notesSuccess) return;

    toast.success("Appointment marked as completed");
    setTimeout(() => {
      setOpen(false);
    }, 0);
  }, [notesSuccess]);

  useEffect(() => {
    if (tokenData?.success) {
      router.push(
        `/video-call?sessionId=${tokenData.videoSessionId}&token=${tokenData.token}&appointmentId=${appointment.id}`,
      );
    }
  }, [tokenData, appointment.id, router]);

  useEffect(() => {
    if (!notesSuccess) return;

    toast.success("Notes saved successfully");
    setTimeout(() => {
      setAction(null);
    }, 0);
  }, [notesSuccess]);

  const cancelSuccess = cancelData?.success;
  useEffect(() => {
    if (!cancelSuccess) return;

    toast.success("Appointment canceled successfully");
    setTimeout(() => {
      setOpen(false);
    }, 0);
  }, [cancelSuccess]);

  const completeSuccess = completeData?.success;
  useEffect(() => {
    if (!completeSuccess) return;

    toast.success("Appointment completed successfully");
    setTimeout(() => {
      setOpen(false);
    }, 0);
  }, [completeSuccess]);

  const getBackgroundColor = () => {
    switch (appointment.status) {
      case "Completed":
        return "bg-emerald-950/20 border-emerald-900/20 opacity-80"; // Muted green
      case "Cancelled":
        return "bg-red-950/10 border-red-900/20 grayscale-[0.5] opacity-70"; // Faded red/grey
      default:
        return "bg-emerald-900/20 border-emerald-900/10"; // Standard for Scheduled
    }
  };

  return (
    <>
      <Card
        className={`transition-all ${getBackgroundColor()} ${
          appointment.status === "Scheduled"
            ? "hover:border-emerald-700/30"
            : "hover:border-white/10"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-muted/20 rounded-cull p-2 mt-1">
                {otherPartyIcon}
              </div>
              <div>
                <h3 className="font-medium text-white">
                  {userRole === "Educator"
                    ? otherParty.name
                    : `${otherParty.name}`}
                </h3>

                {userRole === "Educator" && (
                  <p className="text-sm text-muted-foreground">
                    {otherParty.email}
                  </p>
                )}

                {userRole === "Student" && (
                  <p className="text-sm text-muted-foreground">
                    {otherParty.specialty}
                  </p>
                )}

                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <Calendar className="size-4 mr-1" />
                  <span>{formatDateTime(appointment.startTime)}</span>
                </div>

                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Clock className="size-4 mr-1" />
                  <span>
                    {formatTime(appointment.startTime)} -{" "}
                    {formatTime(appointment.endTime)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 self-end md:self-start">
              <Badge
                variant="outline"
                className={
                  appointment.status === "Completed"
                    ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400 self-start"
                    : appointment.status === "Cancelled"
                      ? "bg-red-900/20 border-red-900/30 text-red-400 self-start"
                      : "bg-amber-900/20 border-r-amber-900/30 text-amber-400 self-start"
                }
              >
                {appointment.status}
              </Badge>

              <div className="flex gap-2 mt-2 flex-wrap">
                {canMarkCompleted() && (
                  <Button
                    onClick={handleMarkCompleted}
                    disabled={completeLoading}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {completeLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="size-4 mr-1" />
                        Complete
                      </>
                    )}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-900/30"
                  onClick={() => setOpen(true)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Appointment Details
            </DialogTitle>
            <DialogDescription>
              {appointment.status === "Scheduled"
                ? "Manage your upcoming appointment"
                : "View appointment information"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {otherPartyLabel}
              </h4>
              <div className="flex items-center">
                <div className="size-5 text-emerald-400 mr-2">
                  {otherPartyIcon}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {userRole === "Educator"
                      ? otherParty.name
                      : ` ${otherParty.name}`}
                  </p>
                  {userRole === "Educator" && (
                    <p className="text-muted-foreground text-sm">
                      {otherParty.email}
                    </p>
                  )}
                  {userRole === "Student" && (
                    <p className="text-muted-foreground text-sm">
                      {otherParty.specialty}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Scheduled Time
              </h4>
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <Calendar className=" size-5 text-emerald-400 mr-2" />
                  <p className="text-white">
                    {formatDateTime(appointment.startTime)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Clock className="size-5 text-emerald-400 mr-2" />
                  <p className="text-white">
                    {formatTime(appointment.startTime)} -{" "}
                    {formatTime(appointment.endTime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Status
              </h4>
              <Badge
                variant="outline"
                className={
                  appointment.status === "Completed"
                    ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400 self-start"
                    : appointment.status === "Cancelled"
                      ? "bg-red-900/20 border-red-900/30 text-red-400 self-start"
                      : "bg-amber-900/20 border-r-amber-900/30 text-amber-400 self-start"
                }
              >
                {appointment.status}
              </Badge>
            </div>

            {appointment.studentDescription && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {userRole === "Educator"
                    ? "Student Description"
                    : "Your Description"}
                </h4>
                <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20">
                  <p className="text-white whitespace-pre-line">
                    {appointment.studentDescription}
                  </p>
                </div>
              </div>
            )}

            {appointment.status === "Scheduled" && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Video Session
                </h4>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={
                    !isAppointmentActive() || action === "video" || tokenLoading
                  }
                  onClick={handleJoinVideoCall}
                >
                  {tokenLoading || action === "video" ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Preparing Video Call...
                    </>
                  ) : (
                    <>
                      <Video className="size-4 mr-2" />
                      {isAppointmentActive()
                        ? "Join Video Call"
                        : "Video Call will be available 30 minutes before appointment"}
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Educator Notes
                </h4>

                {userRole === "Educator" &&
                  action !== "notes" &&
                  appointment.status !== "Cancelled" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAction("notes")}
                      className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
                    >
                      <Edit className="size-3.5 mr-1" />
                      {appointment.notes ? "Edit" : "Add"}
                    </Button>
                  )}
              </div>

              {userRole === "Educator" && action === "notes" ? (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter your notes here..."
                    className="bg-background border-emerald-900/20 min-h-25"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAction(null);
                        setNotes(appointment.notes || "");
                      }}
                      disabled={notesLoading}
                      className="border-emerald-900/30"
                    >
                      Cancel
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={notesLoading}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {notesLoading ? (
                        <>
                          <Loader2 className="mr-2 size-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Notes"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20 min-h-20">
                  {appointment.notes ? (
                    <p className="text-white whitespace-pre-line">
                      {appointment.notes}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No notes added yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            {appointment.status === "Scheduled" && (
              <Button
                variant="outline"
                onClick={handleCancelAppointment}
                disabled={cancelLoading}
                className="border-red-900/30 text-red-400 hover:bg-red-900/10 mt-3 sm:mt-0"
              >
                {cancelLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
