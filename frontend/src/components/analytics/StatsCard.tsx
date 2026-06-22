import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorClass?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorClass = "text-primary bg-primary/15 border-primary/10",
}: StatsCardProps) {
  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="card-body p-6 flex-row items-center gap-5">
        <div className={`p-4 rounded-2xl ${colorClass} flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-grow min-w-0">
          <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block">
            {title}
          </span>
          <span className="text-3xl font-extrabold text-base-content block mt-1 leading-none">
            {value}
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            {trend && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  trend.isPositive ? "bg-success/15 text-success" : "bg-error/15 text-error"
                }`}
              >
                {trend.value}
              </span>
            )}
            <span className="text-xs text-base-content/50 truncate block">
              {subtitle}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
