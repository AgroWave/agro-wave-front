import {
  buildFresnelChartSeries,
  type ElevationProfileSeries,
  type FresnelAnalysis,
} from "../../domain/simulation";

interface LinkProfileChartProps {
  series: ElevationProfileSeries;
  fresnel: FresnelAnalysis;
  endNodeName: string;
  accessNodeName: string;
}

/**
 * Renders an interactive SVG terrain elevation, Line-of-Sight (LoS), first Fresnel zone (F1),
 * and 60% F1 threshold chart with the minimum clearance point highlighted (RN-35).
 * @param props - Component properties with profile series and Fresnel summary.
 * @returns SVG chart element for the link profile.
 */
export function LinkProfileChart(props: LinkProfileChartProps) {
  const { series, fresnel, endNodeName, accessNodeName } = props;
  const points = buildFresnelChartSeries(series);

  if (points.length < 2) {
    return (
      <div className="p-6 text-center text-sm text-slate-400">
        No hay puntos suficientes en el perfil de terreno para graficar.
      </div>
    );
  }

  const width = 760;
  const height = 300;
  const padLeft = 56;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 40;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxDist = Math.max(points[points.length - 1].distanceM, 1);
  const allHeights = points.flatMap((p) => [
    p.terrainM,
    p.f1UpperM,
    p.f1LowerM,
  ]);
  const minElev = Math.floor(Math.min(...allHeights) - 5);
  const maxElev = Math.ceil(Math.max(...allHeights) + 5);
  const elevSpan = Math.max(maxElev - minElev, 1);

  const toX = (d: number) => padLeft + (d / maxDist) * plotW;
  const toY = (e: number) => padTop + (1 - (e - minElev) / elevSpan) * plotH;

  // Terrain polygon path
  const terrainLine = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${toX(p.distanceM).toFixed(1)} ${toY(p.terrainM).toFixed(1)}`)
    .join(" ");
  const terrainArea = `${terrainLine} L ${toX(maxDist).toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${padLeft} ${(padTop + plotH).toFixed(1)} Z`;

  // LoS line path
  const losPath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${toX(p.distanceM).toFixed(1)} ${toY(p.losM).toFixed(1)}`)
    .join(" ");

  // F1 upper and lower envelope paths
  const f1UpperPath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${toX(p.distanceM).toFixed(1)} ${toY(p.f1UpperM).toFixed(1)}`)
    .join(" ");
  const f1LowerPath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${toX(p.distanceM).toFixed(1)} ${toY(p.f1LowerM).toFixed(1)}`)
    .join(" ");

  // 60% F1 threshold lower envelope path
  const f1SixtyLowerPath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${toX(p.distanceM).toFixed(1)} ${toY(p.f1SixtyLowerM).toFixed(1)}`)
    .join(" ");

  // Find closest point to min_clearance_at_m
  let minPoint = points[0];
  let bestDiff = Infinity;
  for (const pt of points) {
    const diff = Math.abs(pt.distanceM - fresnel.min_clearance_at_m);
    if (diff < bestDiff) {
      bestDiff = diff;
      minPoint = pt;
    }
  }

  return (
    <div className="rounded-none border border-slate-300 bg-white p-5 shadow-2xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h4 className="text-sm font-bold text-[#0f172a]">
            Perfil de Terreno y Primera Zona de Fresnel ({endNodeName} → {accessNodeName})
          </h4>
          <p className="text-xs text-[#475569] font-medium mt-0.5">
            Curvatura terrestre k = 4/3 · Despeje mínimo:{" "}
            <span className="font-mono font-bold text-[#0f172a]">
              {fresnel.min_clearance_ratio.toFixed(2)} F1
            </span>{" "}
            a{" "}
            <span className="font-mono font-bold text-[#0f172a]">
              {(fresnel.min_clearance_at_m / 1000).toFixed(2)} km
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#1e293b]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-none bg-emerald-600/70" />
            Terreno + curvatura
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-sky-500" />
            Línea de vista (LoS)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 border-b-2 border-dashed border-amber-500" />
            Zona F1 (100 %)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 border-b-2 border-dotted border-rose-500" />
            Umbral 60 % F1
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="Gráfico de perfil de terreno y zona de Fresnel"
      >
        {/* Horizontal elevation grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const elev = minElev + t * elevSpan;
          const y = toY(elev);
          return (
            <g key={t}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#cbd5e1"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {Math.round(elev)} m
              </text>
            </g>
          );
        })}

        {/* Terrain area and stroke */}
        <path d={terrainArea} fill="rgba(16, 185, 129, 0.18)" />
        <path d={terrainLine} fill="none" stroke="#10b981" strokeWidth={2} />

        {/* F1 upper and lower envelopes */}
        <path
          d={f1UpperPath}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={1.3}
          strokeDasharray="5 4"
        />
        <path
          d={f1LowerPath}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={1.3}
          strokeDasharray="5 4"
        />

        {/* 60% F1 threshold lower envelope */}
        <path
          d={f1SixtyLowerPath}
          fill="none"
          stroke="#fb7185"
          strokeWidth={1.4}
          strokeDasharray="2 3"
        />

        {/* Direct Line of Sight */}
        <path d={losPath} fill="none" stroke="#38bdf8" strokeWidth={2} />

        {/* Minimum clearance marker */}
        <line
          x1={toX(minPoint.distanceM)}
          y1={toY(minPoint.losM)}
          x2={toX(minPoint.distanceM)}
          y2={toY(minPoint.terrainM)}
          stroke="#f43f5e"
          strokeWidth={1.8}
        />
        <circle
          cx={toX(minPoint.distanceM)}
          cy={toY(minPoint.terrainM)}
          r={4}
          fill="#f43f5e"
        />

        {/* X axis distance labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const dist = t * maxDist;
          const x = toX(dist);
          return (
            <text
              key={t}
              x={x}
              y={height - 10}
              textAnchor="middle"
              className="fill-slate-400 text-[10px]"
            >
              {(dist / 1000).toFixed(2)} km
            </text>
          );
        })}
      </svg>
    </div>
  );
}
