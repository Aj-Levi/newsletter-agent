"use client";

import React, { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

interface SourceDonutChartProps {
  data: Array<{
    domain: string;
    count: number;
  }>;
}

export default function SourceDonutChart({ data }: SourceDonutChartProps) {
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
    if (!mounted || !chartRef.current || !data || data.length === 0) return;

    // Dynamically import ApexCharts to ensure it's client-only
    import("apexcharts").then(({ default: ApexCharts }) => {
      if (!chartRef.current) return;
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const total = data.reduce((acc, d) => acc + d.count, 0);

      const options: any = {
        chart: {
          type: "donut",
          height: 280,
          background: "transparent",
          fontFamily: "inherit",
        },
        series: data.map((d) => d.count),
        labels: data.map((d) => d.domain),
        colors: ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f87171"],
        stroke: {
          show: true,
          width: 2,
          colors: ["var(--fallback-b2,oklch(var(--b2)/1))"],
        },
        dataLabels: {
          enabled: false,
        },
        legend: {
          position: "bottom",
          fontSize: "12px",
          fontFamily: "inherit",
          labels: {
            colors: "oklch(var(--bc))",
          },
          itemMargin: {
            horizontal: 10,
            vertical: 5,
          },
        },
        plotOptions: {
          pie: {
            donut: {
              size: "72%",
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "oklch(var(--bc))",
                },
                value: {
                  show: true,
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "oklch(var(--bc))",
                  formatter: (val: string) => val,
                },
                total: {
                  show: true,
                  label: "Citations",
                  color: "oklch(var(--bc))",
                  formatter: () => String(total),
                },
              },
            },
          },
        },
        tooltip: {
          theme: "dark",
          y: {
            formatter: (val: number) => `${val} citations`,
          },
        },
      };

      chartInstance.current = new ApexCharts(chartRef.current, options);
      chartInstance.current.render();
    });
  }, [mounted, data]);

  if (!mounted) {
    return (
      <div className="h-64 bg-base-300/20 animate-pulse rounded-2xl flex items-center justify-center">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-base-100/50 rounded-2xl border-2 border-dashed border-base-300 h-[280px]">
        <Info className="w-10 h-10 text-base-content/30 mb-2" />
        <h4 className="text-sm font-bold text-base-content">No citations data</h4>
        <p className="text-xs text-base-content/50 mt-1">Citations statistics will populate once newsletters are generated.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={chartRef} className="w-full min-h-[280px]"></div>
    </div>
  );
}
