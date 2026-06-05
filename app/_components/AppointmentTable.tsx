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
  userRole: "Educator" | "Learner";
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
