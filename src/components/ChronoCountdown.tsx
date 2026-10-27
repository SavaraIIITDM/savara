"use client";

import { useEffect, useMemo, useState } from "react";
import { COUNTDOWN_TARGET_MS, getCountdownParts } from "@/lib/site-release";

function TimeUnit({
  value,
}: {
  value: number;
}) {
  const padded = String(value).padStart(2, "0");

  return (
    <div className="chrono-unit min-w-16 sm:min-w-20">
      <span key={padded} className="chrono-digit-value">
        {padded}
      </span>
    </div>
  );
}

export default function ChronoCountdown() {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const update = () => {
      const current = Date.now();
      setNowMs(current);
      if (current >= COUNTDOWN_TARGET_MS) setIsComplete(true);
    };

    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = useMemo(
    () => getCountdownParts(nowMs ?? COUNTDOWN_TARGET_MS),
    [nowMs],
  );

  return (
    <div
      className="mt-4 flex w-full flex-col items-center"
      role="timer"
      aria-label={nowMs === null ? "Countdown to April 1, 2027, midnight IST" : `${time.days} days, ${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds until April 1, 2027, midnight IST`}
    >
      <div className="w-full max-w-4xl px-3 sm:px-6">
        {isComplete ? (
          <div className="chrono-breach-text">
            Savāra is here
          </div>
        ) : (
          <div className="chrono-digits-row flex items-center justify-center gap-3 sm:gap-5">
            <TimeUnit value={time.days} />
            <span className="chrono-dot-separator">•</span>
            <TimeUnit value={time.hours} />
            <span className="chrono-dot-separator">•</span>
            <TimeUnit value={time.minutes} />
            <span className="chrono-dot-separator">•</span>
            <TimeUnit value={time.seconds} />
          </div>
        )}
      </div>
    </div>
  );
}
