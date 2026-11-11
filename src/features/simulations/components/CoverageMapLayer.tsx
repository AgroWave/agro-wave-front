import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as React from "react";
import type { CoverageSample } from "../../../domain/simulation";

export interface EndNodeMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heightAglM?: number;
}

export interface CoverageMapLayerProps {
  accessNodeName: string;
  accessNodeLat: number;
  accessNodeLon: number;
  sensitivityDbm: number;
  samples: CoverageSample[];
  endNodes?: EndNodeMarker[];
}

/**
 * Interactive Leaflet map rendering spatial coverage samples and sensor end nodes.
 */
export const CoverageMapLayer: React.FC<CoverageMapLayerProps> = ({
  accessNodeName,
  accessNodeLat,
  accessNodeLon,
  sensitivityDbm,
  samples,
  endNodes = [],
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const layerGroupRef = React.useRef<L.LayerGroup | null>(null);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const map = L.map(containerRef.current, {
        center: [accessNodeLat, accessNodeLon],
        zoom: 12,
        minZoom: 4,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapRef.current = map;
    } catch {
      // Ignore Leaflet container already initialized in test environments
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [accessNodeLat, accessNodeLon]);

  React.useEffect(() => {
    const layerGroup = layerGroupRef.current;
    const map = mapRef.current;
    if (!layerGroup || !map) return;

    layerGroup.clearLayers();

    // 1. Spatial Coverage Samples (soft semi-transparent overlay)
    const latLngs: L.LatLngTuple[] = [[accessNodeLat, accessNodeLon]];

    samples.forEach((sample) => {
      const isViable = sample.viable;
      const color = isViable ? "#16a34a" : "#dc2626";
      const radius = isViable ? 3.0 : 1.8;
      // High transparency so terrain and roads remain clearly visible beneath
      const opacity = isViable ? 0.22 : 0.08;

      const circle = L.circleMarker([sample.latitude, sample.longitude], {
        radius,
        color,
        fillColor: color,
        fillOpacity: opacity,
        stroke: false,
      });

      circle.bindTooltip(
        `<b>Azimut:</b> ${sample.azimuth_deg}°<br/><b>Distancia:</b> ${(sample.distance_m / 1000).toFixed(2)} km<br/><b>P<sub>rx</sub>:</b> ${sample.received_power_dbm.toFixed(1)} dBm<br/><b>Viable:</b> ${isViable ? "Sí" : "No"}`,
        { sticky: true }
      );

      circle.addTo(layerGroup);
      latLngs.push([sample.latitude, sample.longitude]);
    });

    // 2. Sensor End Node Markers (High-contrast blue badges with zIndexOffset)
    endNodes.forEach((node) => {
      const sensorIcon = L.divIcon({
        className: "custom-sensor-marker",
        html: `<div style="background-color:#0284c7;color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.35);" title="Nodo Sensor: ${node.name}">SN</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([node.lat, node.lng], { icon: sensorIcon, zIndexOffset: 800 })
        .bindPopup(
          `<b>Nodo Sensor: ${node.name}</b><br/>Lat: ${node.lat.toFixed(5)}<br/>Lon: ${node.lng.toFixed(5)}${node.heightAglM !== undefined ? `<br/>Altura: ${node.heightAglM} m AGL` : ""}`
        )
        .addTo(layerGroup);

      latLngs.push([node.lat, node.lng]);
    });

    // 3. Access Node Gateway Marker (High-priority maroon badge)
    const gwIcon = L.divIcon({
      className: "custom-gw-marker",
      html: `<div style="background-color:#991b1b;color:white;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.4);" title="Access Node Gateway">GW</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    L.marker([accessNodeLat, accessNodeLon], { icon: gwIcon, zIndexOffset: 1000 })
      .bindPopup(
        `<b>Access Node: ${accessNodeName}</b><br/>Lat: ${accessNodeLat.toFixed(5)}<br/>Lon: ${accessNodeLon.toFixed(5)}<br/>Sensibilidad: ${sensitivityDbm} dBm`
      )
      .addTo(layerGroup);

    if (latLngs.length > 1) {
      try {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [20, 20] });
      } catch {
        // bounds fit fallback
      }
    }
  }, [accessNodeLat, accessNodeLon, accessNodeName, sensitivityDbm, samples, endNodes]);

  return (
    <div
      className="relative rounded-lg border border-slate-300 overflow-hidden shadow-sm"
      data-testid="coverage-map-container"
    >
      <div ref={containerRef} className="h-96 w-full bg-slate-100" />
      <div className="absolute top-2 right-2 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded shadow-md border border-slate-300 text-xs">
        <div className="font-bold text-[#0f172a] mb-1.5 border-b pb-1">
          Mapa de Cobertura Zonal
        </div>
        <div className="space-y-1 text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#991b1b] text-white text-[9px] font-bold">
              GW
            </span>
            <span className="font-medium text-[#0f172a]">Gateway (Access Node)</span>
          </div>
          {endNodes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#0284c7] text-white text-[9px] font-bold">
                SN
              </span>
              <span className="font-medium text-[#0f172a]">
                Nodos Sensores ({endNodes.length})
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-[#16a34a]/40 border border-[#16a34a]"></span>
            <span>Viable (P<sub>rx</sub> ≥ {sensitivityDbm} dBm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-[#dc2626]/20 border border-[#dc2626]"></span>
            <span>No viable (Bajo umbral)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
