"use client";
import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
export default function SnapshotButton(){const [saving,setSaving]=useState(false);async function capture(){setSaving(true);try{const r=await fetch("/api/admin/investments/snapshots",{method:"POST"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to capture snapshot");toast.success("Portfolio snapshot captured");location.reload()}catch(e){toast.error(e instanceof Error?e.message:"Unable to capture snapshot")}finally{setSaving(false)}}return <button onClick={capture} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Camera className="h-4 w-4"/>}{saving?"Capturing…":"Capture today"}</button>}
