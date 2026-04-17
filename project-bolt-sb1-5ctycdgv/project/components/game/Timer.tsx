'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  duration: number;
  onExpire: () => void;
  paused?: boolean;
}

export default function Timer({ duration, onExpire, paused = false }: Props) {
  const [timeLeft, setTimeLeft] = useState(duration);

  const reset = useCallback(() => setTimeLeft(duration), [duration]);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (paused) return;
    if (timeLeft <= 0) {
      onExpire();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, paused, onExpire]);

  const pct = (timeLeft / duration) * 100;
  const isUrgent = timeLeft <= 5;
  const isWarning = timeLeft <= 10;

  const barColor = isUrgent ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-sky-500';
  const textColor = isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-sky-600';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <div className={`flex items-center gap-1 text-sm font-bold ${textColor} ${isUrgent ? 'animate-pulse' : ''}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{timeLeft}s</span>
        </div>
        <span className="text-xs text-muted-foreground">{duration}s total</span>
      </div>
      <div className="h-2.5 bg-sky-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full timer-bar ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
