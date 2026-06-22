"use client";

import React, { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

interface RunTimelineProps {
  runs: Array<{
    id: string;
    createdAt: string;
    status: string;
    subjectLine: string;
    totalSourcesFound: number;
    sourcesUsed: number;
    avgRelevanceScore: number | null;
    subscription: {
      topic: string;
    };
  }>;
}

export default function RunTimeline({ runs }: RunTimelineProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted || !chartRef.current || !runs || runs.length === 0) return;

    import("apexcharts").then(({ default: ApexCharts }) => {
      if (!chartRef.current) return;
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const options: any = {
        chart: {
          height: 320,
          type: "line",
          background: "transparent",
          fontFamily: "inherit",
          toolbar: {
            show: false,
          },
        },
        stroke: {
          width: 3,
          curve: "smooth",
        },
        colors: ["#38bdf8"], // Primary Theme Blue
        series: [
          {
            name: "Relevance Score",
            data: runs.map((r) =>
              r.avgRelevanceScore
                ? parseFloat(Number(r.avgRelevanceScore).toFixed(2))
                : 0.0
            ),
          },
        ],
        markers: {
          size: 6,
          strokeWidth: 2,
          strokeColors: ["var(--fallback-b2,oklch(var(--b2)/1))"],
          hover: {
            size: 8,
          },
        },
        grid: {
          borderColor: "rgba(156, 163, 175, 0.15)",
          strokeDashArray: 4,
        },
        xaxis: {
          type: "category",
          labels: {
            style: {
              colors: "oklch(var(--bc) / 0.7)",
              fontSize: "11px",
            },
          },
          axisBorder: {
            show: true,
            color: "rgba(156, 163, 175, 0.3)",
          },
          axisTicks: {
            show: true,
            color: "rgba(156, 163, 175, 0.3)",
          },
        },
        yaxis: {
          min: 0,
          max: 1.0,
          tickAmount: 5,
          axisBorder: {
            show: true,
            color: "rgba(156, 163, 175, 0.3)",
          },
          axisTicks: {
            show: true,
            color: "rgba(156, 163, 175, 0.3)",
          },
          title: {
            text: "Relevance Score",
            style: {
              color: "oklch(var(--bc))",
              fontWeight: 600,
            },
          },
          labels: {
            style: {
              colors: "oklch(var(--bc) / 0.7)",
            },
            formatter: (val: number) => val.toFixed(1),
          },
        },
        tooltip: {
          theme: "dark",
          shared: false,
          intersect: true,
          custom: function ({ dataPointIndex }: any) {
            const run = runs[dataPointIndex];
            if (!run) return "";

            const isSuccess = run.status === "COMPLETED";
            const statusText = isSuccess ? "Success" : "Failed";
            const statusClass = isSuccess ? "text-success" : "text-error";
            const runDate = new Date(run.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            const relevanceScore = run.avgRelevanceScore
              ? `${Math.round(run.avgRelevanceScore * 100)}%`
              : "0%";

            return `
              <div class="p-3 bg-neutral text-neutral-content rounded-xl border border-base-300 min-w-[200px] text-xs space-y-1.5 shadow-xl font-sans">
                <div class="font-bold border-b border-base-300/40 pb-1">${run.subscription?.topic}</div>
                <div class="italic text-neutral-content/80 line-clamp-2">"${run.subjectLine || "No subject"}"</div>
                <div class="pt-1.5 space-y-1 text-neutral-content/70">
                  <div class="flex justify-between">
                    <span>Date:</span>
                    <span class="font-semibold text-neutral-content">${runDate}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Status:</span>
                    <span class="font-bold ${statusClass}">${statusText}</span>
                  </div>
                  <div class="flex justify-between border-t border-base-300/20 pt-1 mt-1 font-bold">
                    <span>Relevance:</span>
                    <span class="text-primary">${relevanceScore}</span>
                  </div>
                </div>
              </div>
            `;
          },
        },
      };

      chartInstance.current = new ApexCharts(chartRef.current, options);
      chartInstance.current.render();
    });
  }, [mounted, runs]);

  if (!mounted) {
    return (
      <div className="h-64 bg-base-300/20 animate-pulse rounded-2xl flex items-center justify-center">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-base-100/50 rounded-2xl border-2 border-dashed border-base-300">
        <Info className="w-10 h-10 text-base-content/30 mb-2" />
        <h4 className="text-sm font-bold text-base-content">No runs data available</h4>
        <p className="text-xs text-base-content/50 mt-1">Timeline updates once the agent starts compiling newsletters.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={chartRef} className="w-full min-h-[320px]"></div>
    </div>
  );
}
