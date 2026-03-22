"use client";

import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveRadar } from "@nivo/radar";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { ResponsiveFunnel } from "@nivo/funnel";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";

const chartTheme = {
  background: "transparent",
  text: { fill: "rgba(255,255,255,0.8)", fontSize: 11 },
  axis: {
    domain: { line: { stroke: "rgba(255,255,255,0.2)" } },
    ticks: {
      line: { stroke: "rgba(255,255,255,0.2)" },
      text: { fill: "rgba(255,255,255,0.6)", fontSize: 10 },
    },
    legend: { text: { fill: "rgba(255,255,255,0.7)", fontSize: 12 } },
  },
  grid: { line: { stroke: "rgba(255,255,255,0.08)" } },
  legends: { text: { fill: "rgba(255,255,255,0.7)", fontSize: 11 } },
  tooltip: {
    container: {
      background: "rgba(0,0,0,0.85)",
      color: "#fff",
      fontSize: 12,
      borderRadius: "4px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    },
  },
  labels: { text: { fill: "#fff", fontSize: 11, fontWeight: 600 } },
};

const colors = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#818cf8", "#7c3aed", "#4f46e5", "#5b21b6",
  "#a855f7", "#9333ea", "#7e22ce", "#6d28d9",
];

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ChartData {
  type: string;
  title?: string;
  data: any[];
  keys?: string[];
  indexBy?: string;
}

export function NivoChart({ chart }: { chart: ChartData }) {
  const { type, title, data, keys, indexBy } = chart;

  return (
    <div className="w-full my-4">
      {title && (
        <h4
          className="text-white/80 text-sm font-medium mb-3 tracking-wide uppercase"
          style={{ letterSpacing: "0.05em" }}
        >
          {title}
        </h4>
      )}
      <div className="w-full h-[320px] bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4">
        {type === "bar" && (
          <ResponsiveBar
            data={data as any}
            keys={keys || []}
            indexBy={indexBy || "id"}
            margin={{ top: 20, right: 120, bottom: 50, left: 60 }}
            padding={0.3}
            colors={colors}
            theme={chartTheme}
            borderRadius={3}
            axisBottom={{ tickRotation: -30 }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            legends={[
              {
                dataFrom: "keys",
                anchor: "bottom-right",
                direction: "column",
                translateX: 120,
                itemWidth: 100,
                itemHeight: 20,
                itemTextColor: "rgba(255,255,255,0.7)",
              },
            ]}
            animate={true}
          />
        )}
        {type === "line" && (
          <ResponsiveLine
            data={data as { id: string; data: { x: string | number; y: number }[] }[]}
            margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
            colors={colors}
            theme={chartTheme}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: "auto", max: "auto" }}
            curve="catmullRom"
            pointSize={8}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            enableArea={true}
            areaOpacity={0.1}
            useMesh={true}
            legends={[
              {
                anchor: "bottom-right",
                direction: "column",
                translateX: 100,
                itemWidth: 80,
                itemHeight: 20,
                itemTextColor: "rgba(255,255,255,0.7)",
              },
            ]}
            animate={true}
          />
        )}
        {type === "pie" && (
          <ResponsivePie
            data={data as { id: string; label: string; value: number }[]}
            margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
            innerRadius={0.5}
            padAngle={2}
            cornerRadius={4}
            colors={colors}
            theme={chartTheme}
            borderWidth={1}
            borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
            arcLinkLabelsTextColor="rgba(255,255,255,0.7)"
            arcLinkLabelsColor={{ from: "color" }}
            arcLabelsTextColor="#fff"
            animate={true}
          />
        )}
        {type === "radar" && (
          <ResponsiveRadar
            data={data as any}
            keys={keys || []}
            indexBy={indexBy || "category"}
            margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
            colors={colors}
            theme={chartTheme}
            borderColor={{ from: "color" }}
            gridLabelOffset={20}
            dotSize={8}
            dotColor={{ theme: "background" }}
            dotBorderWidth={2}
            fillOpacity={0.15}
            blendMode="normal"
            animate={true}
          />
        )}
        {type === "heatmap" && (
          <ResponsiveHeatMap
            data={data as { id: string; data: { x: string; y: number | null }[] }[]}
            margin={{ top: 20, right: 60, bottom: 60, left: 60 }}
            theme={chartTheme}
            colors={{
              type: "sequential",
              scheme: "purples",
            }}
            animate={true}
          />
        )}
        {type === "funnel" && (
          <ResponsiveFunnel
            data={data as { id: string; label: string; value: number }[]}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            colors={colors}
            theme={chartTheme}
            borderWidth={20}
            borderOpacity={0.3}
            labelColor="#fff"
            animate={true}
          />
        )}
        {type === "scatter" && (
          <ResponsiveScatterPlot
            data={data as { id: string; data: { x: number; y: number }[] }[]}
            margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
            colors={colors}
            theme={chartTheme}
            xScale={{ type: "linear", min: "auto", max: "auto" }}
            yScale={{ type: "linear", min: "auto", max: "auto" }}
            nodeSize={10}
            useMesh={true}
            legends={[
              {
                anchor: "bottom-right",
                direction: "column",
                translateX: 100,
                itemWidth: 80,
                itemHeight: 20,
                itemTextColor: "rgba(255,255,255,0.7)",
              },
            ]}
            animate={true}
          />
        )}
      </div>
    </div>
  );
}

interface DashboardData {
  title: string;
  charts: ChartData[];
}

export function NivoDashboard({
  dashboard,
  onDownloadPdf,
}: {
  dashboard: DashboardData;
  onDownloadPdf: () => void;
}) {
  return (
    <div className="w-full my-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-white text-lg font-medium"
              style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
            >
              {dashboard.title}
            </h3>
            <p className="text-white/40 text-xs mt-1">
              Interactive Dashboard &middot; {dashboard.charts.length} Charts
            </p>
          </div>
          <button
            onClick={onDownloadPdf}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/80 text-xs uppercase tracking-widest px-4 py-2 rounded transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dashboard.charts.map((chart, idx) => (
            <NivoChart key={idx} chart={chart} />
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <p className="text-white/30 text-[10px] tracking-widest uppercase">
            Powered With Louati Mahdi
          </p>
        </div>
      </div>
    </div>
  );
}
