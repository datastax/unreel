export function LeaderboardCountdown({
  timeRemaining,
}: {
  timeRemaining: number;
}) {
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="stroke-current text-gray-900"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="10"
        />
        <circle
          className="stroke-current text-white transition-all duration-300 ease-in-out"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * (timeRemaining / 1000)) / 60}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-4xl font-bold">{Math.ceil(timeRemaining / 1000)}</p>
      </div>
    </div>
  );
}
