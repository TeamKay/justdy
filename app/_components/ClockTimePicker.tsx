"use client";

import { InputGroup, InputGroupInput } from "./ui/input-group";

interface ClockTimePickerProps {
  hour: string;
  minute: string;
  period: string;

  setHour: (v: string) => void;
  setMinute: (v: string) => void;
  setPeriod: (v: string) => void;
}

export default function ClockTimePicker({
  hour,
  minute,
  period,
  setHour,
  setMinute,
  setPeriod,
}: ClockTimePickerProps) {
  function to24Hour() {
    let h = Number(hour);

    if (period === "PM" && h !== 12) {
      h += 12;
    }

    if (period === "AM" && h === 12) {
      h = 0;
    }

    return `${String(h).padStart(2, "0")}:${minute}`;
  }

  function handleTimeChange(value: string) {
    if (!value) return;
    const [h, m] = value.split(":");
    const hour24 = Number(h);
    const newPeriod = hour24 >= 12 ? "PM" : "AM";
    let displayHour = hour24 % 12;
    if (displayHour === 0) {
      displayHour = 12;
    }

    setHour(String(displayHour).padStart(2, "0"));
    setMinute(m);
    setPeriod(newPeriod);
  }

  function togglePeriod() {
    setPeriod(period === "AM" ? "PM" : "AM");
  }

  return (
    <InputGroup className="bg-amber-700 rounded-md">
      <InputGroupInput
        type="time"
        value={to24Hour()}
        onChange={(e) => handleTimeChange(e.target.value)}
        step="900"
        className="h-11 text-sm pr-0 bg-amber-400 text-black placeholder:text-black"
      />

      {/* AM PM SWITCH */}
      <button
        type="button"
        onClick={togglePeriod}
        className="absolute right-10 top-1/2 -translate-y-1/2 text-sm font-semibold bg-amber-500 text-gray-600 hover:text-black"
      >
        {period}
      </button>
    </InputGroup>
  );
}
