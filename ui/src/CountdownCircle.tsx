import React from "react";

interface CountdownCircleProps {
  timeout: number; // in milliseconds
  remainingTime: number;
  size?: number; // in pixels
  color?: string;
}

export const CountdownCircle: React.FC<CountdownCircleProps> = ({
  timeout,
  color = "black",
  remainingTime,
}) => {
  const progress = (remainingTime / timeout) * 100;

  return (
    <div
      className={`fixed top-4 right-4 w-[32px] h-[32px] rounded-full flex items-center justify-center`}
      style={{
        background: `conic-gradient(${color} ${progress}%, transparent ${progress}%)`,
      }}
    >
      <div className="absolute inset-1 bg-transparent rounded-full flex items-center justify-center">
        <span className="text-xs font-bold text-white">
          {Math.ceil(remainingTime / 1000)}
        </span>
      </div>
    </div>
  );
};
