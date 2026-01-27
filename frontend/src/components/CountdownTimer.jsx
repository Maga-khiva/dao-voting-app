import React, { useState, useEffect } from "react";

export const CountdownTimer = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Convert deadline from seconds to milliseconds
      const deadlineMs = deadline * 1000;
      const now = Date.now();
      const difference = deadlineMs - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        return;
      }

      setIsExpired(false);

      // Calculate D:H:M:S
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference / (1000 * 60 * 60)) % 24
      );
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (isExpired) {
    return (
      <div className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-600 font-bold text-xs uppercase">
        🔴 Voting Ended
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-bold text-xs uppercase">
        ⏳ Loading...
      </div>
    );
  }

  return (
    <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-bold text-xs uppercase">
      ⏱️ {timeLeft.days}D:{timeLeft.hours}H:{timeLeft.minutes}M:{timeLeft.seconds}S
    </div>
  );
};
