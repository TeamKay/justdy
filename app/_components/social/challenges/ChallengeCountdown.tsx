
"use client";

type ChallengeCountdownProps = {
  opensAt: string | null;
  closesAt: string | null;
  now: number | null;
  status: "OPEN" | "CLOSED" | "CANCELLED" | null;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getCountdownParts(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function ChallengeCountdown({
  opensAt,
  closesAt,
  now,
  status,
}: ChallengeCountdownProps) {
  if (!opensAt || !closesAt || now === null) {
    return null;
  }

  const openingTime = new Date(opensAt).getTime();
  const closingTime = new Date(closesAt).getTime();

  if (
    !Number.isFinite(openingTime) ||
    !Number.isFinite(closingTime)
  ) {
    return null;
  }

  const isCancelled = status === "CANCELLED";
  const isClosed = status === "CLOSED" || now >= closingTime;
  const isBeforeOpening = now < openingTime;

  if (isCancelled || isClosed) {
    return (
      <div className="mt-3 rounded-lg border border-[#F0D8D5] bg-[#FFF7F6] px-3 py-3">
        <p className="text-center text-sm font-bold text-[#A34C43]">
          {isCancelled ? "Challenge cancelled" : "Challenge closed"}
        </p>
        <p className="mt-1 text-center text-xs text-[#956A65]">
          {isCancelled
            ? "This challenge is no longer available."
            : "The submission deadline has passed. Answers can no longer be submitted or updated."}
        </p>
      </div>
    );
  }

  const targetTime = isBeforeOpening ? openingTime : closingTime;
  const parts = getCountdownParts(targetTime - now);

  const label = isBeforeOpening
    ? "Challenge opens in"
    : "Time remaining";

  return (
    <div
      className={`mt-3 rounded-lg border px-3 py-3 ${
        isBeforeOpening
          ? "border-[#E9E2D1] bg-[#FFF9EB]"
          : "border-[#DCE9DE] bg-[#F3F8F3]"
      }`}
      aria-live="polite"
    >
      <p
        className={`mb-2 text-center text-xs font-semibold ${
          isBeforeOpening ? "text-[#806C4E]" : "text-[#315B43]"
        }`}
      >
        {label}
      </p>

      <div className="flex items-center justify-center gap-2">
        {parts.days > 0 && (
          <>
            <TimeUnit value={parts.days} label="Days" />
            <span className="font-bold text-[#718174]">:</span>
          </>
        )}

        <TimeUnit value={parts.hours} label="Hours" />
        <span className="font-bold text-[#718174]">:</span>
        <TimeUnit value={parts.minutes} label="Minutes" />
        <span className="font-bold text-[#718174]">:</span>
        <TimeUnit value={parts.seconds} label="Seconds" />
      </div>
    </div>
  );
}

function TimeUnit({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="min-w-[43px] text-center">
      <div className="text-xl font-bold tabular-nums text-[#315B43]">
        {pad(value)}
      </div>
      <div className="text-[10px] font-medium text-[#849087]">
        {label}
      </div>
    </div>
  );
}
