"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Clock, Plus, X, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Badge } from "@/app/_components/ui/badge";
import setAvailabilitySlots from "@/app/actions/educator";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import deleteAvailabilitySlot from "../actions/educator-delete-availability";

// --- Types & Helpers ---
type SlotStatus = "Available" | "Booked" | "Blocked" | string;

interface Slot {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: SlotStatus;
}

interface AvailabilitySettingsProps {
  slots?: Slot[];
}

interface AvailabilityFormInputs {
  startTime: string;
  endTime: string;
}

function createLocalDateFromTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
  );
}

export default function AvailabilitySettings({
  slots = [],
}: AvailabilitySettingsProps) {
  const [showForm, setShowForm] = useState(false);
  const { loading, fn: submitSlots } = useFetch(setAvailabilitySlots);
  const { loading: deleting, fn: deleteSlot } = useFetch(
    deleteAvailabilitySlot,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: {},
  } = useForm({
    defaultValues: { startTime: "", endTime: "" },
  });

  const onSubmit = async (formData: AvailabilityFormInputs) => {
    const startDate = createLocalDateFromTime(formData.startTime);
    const endDate = createLocalDateFromTime(formData.endTime);

    if (startDate >= endDate) {
      toast.error("End time must be after start time");
      return;
    }

    const payload = new FormData();
    payload.append("startTime", startDate.toISOString());
    payload.append("endTime", endDate.toISOString());

    const result = await submitSlots(payload);
    if (result?.success) {
      setShowForm(false);
      toast.success("Availability updated");
      reset();
    }
  };

  const handleDelete = async (id: string) => {
    const formData = new FormData();
    formData.append("id", id);

    const result = await deleteSlot(formData);

    if (result?.success) {
      toast.success("Slot deleted successfully");
    } else {
      toast.error("Failed to delete slot");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Availability
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage the time slots students can book for sessions.
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
          >
            <Plus className="size-4 mr-2" />
            Add New Slot
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form (Conditional) */}
        {showForm && (
          <Card className="lg:col-span-1 border-emerald-500/20 bg-emerald-500/5 h-fit sticky top-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-white">
                  Set Time
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowForm(false)}
                  className="h-8 w-8"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="startTime"
                      className="text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      Start Time
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      className="bg-background border-emerald-900/50"
                      {...register("startTime", { required: "Required" })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="endTime"
                      className="text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      End Time
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      className="bg-background border-emerald-900/50"
                      {...register("endTime", { required: "Required" })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Slot"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Right Column: Slot Display */}
        <Card
          className={cn(
            "border-white/5 bg-white/5 backdrop-blur-sm",
            showForm ? "lg:col-span-2" : "lg:col-span-3",
          )}
        >
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CalendarIcon className="size-5 text-emerald-400" />
              Active Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/10 rounded-xl">
                <Clock className="size-10 text-muted-foreground/40 mb-4" />
                <h3 className="text-white font-medium">No slots defined</h3>
                <p className="text-sm text-muted-foreground max-w-62.5 mt-1">
                  You haven&apos;t added any availability yet. Start by clicking
                  &quot;Add New Slot&quot;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="group flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-white font-semibold">
                          {format(new Date(slot.startTime), "h:mm a")}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase tracking-tight">
                          Until {format(new Date(slot.endTime), "h:mm a")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          "font-normal text-[10px] uppercase tracking-wider px-2 py-0.5",
                          slot.status === "Booked"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        )}
                      >
                        {slot.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(slot.id)}
                        disabled={deleting}
                        className="size-8 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
