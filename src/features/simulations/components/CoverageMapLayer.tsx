import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as React from "react";
import type { CoverageSample } from "../../../domain/simulation";

interface CoverageMapLayerProps {
  accessNodeName: string;
  accessNodeLat: number;
  accessNodeLon: number;
  sensitivityDbm: number;
  samples: CoverageSample[];
}

/**
 * Interactive Leaflet map rendering spatial coverage samples around an access node.
 */
export const CoverageMapLayer: React.FC<CoverageMapLayerProps> = ({
  accessNodeName,
  accessNodeLat,
  accessNodeLon,
  sensitivityDbm,
  samples,
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

    // 1. Access Node Gateway Marker
    const gwIcon = L.divIcon({
      className: "custom-gw-marker",
      html: `<div style="background-color:#991b1b;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">GW</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([accessNodeLat, accessNodeLon], { icon: gwIcon })
      .bindPopup(
        `<b>Access Node: ${accessNodeName}</b><br/>Lat: ${accessNodeLat.toFixed(5)}<br/>Lon: ${accessNodeLon.toFixed(5)}<br/>Sensibilidad: ${sensitivityDbm} dBm`
      )
      .addTo(layerGroup);

    // 2. Spatial Coverage Samples
    const latLngs: L.LatLngTuple[] = [[accessNodeLat, accessNodeLon]];

    samples.forEach((sample) => {
      const isViable = sample.viable;
      const color = isViable ? "#16a34a" : "#dc2626";
      const radius = isViable ? 3.5 : 2.0;
      const opacity = isViable ? 0.75 : 0.35;

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

    if (latLngs.length > 1) {
      try {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [20, 20] });
      } catch {
        // bounds fit fallback
      }
    }
  }, [accessNodeLat, accessNodeLon, accessNodeName, sensitivityDbm, samples]);

  return (
    <div className="relative rounded-lg border border-gray-300 overflow-hidden shadow-sm" data-testid="coverage-map-container">
      <div ref={containerRef} className="h-96 w-full bg-slate-100" />
      <div className="absolute top-2 right-2 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-md shadow border border-gray-200 text-xs">
        <div className="font-semibold text-gray-800 mb-1">Mapa de Cobertura Zonal</div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600"></span>
          <span>Viable (P<sub>rx</sub> ≥ {sensitivityDbm} dBm)</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600 mt-0.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600"></span>
          <span>No viable (Bajo umbral)</span>
        </div>
      </div>
    </div>
  );
};
