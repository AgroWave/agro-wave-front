import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as React from "react";
import type { AccessNode, EndNode, Link } from "../../domain/scenarios";
import { boundsDimensionsKm, type Bounds } from "../../domain/terrain";

/**
 * Props for the ScenarioMap component.
 */
export interface ScenarioMapProps {
  bounds: Bounds;
  accessNodes: AccessNode[];
  endNodes: EndNode[];
  links: Link[];
  selectedNodeId: string | null;
  onSelectNode?: (nodeId: string) => void;
  onMoveNode?: (
    role: "ACCESS_NODE" | "END_NODE",
    nodeId: string,
    lat: number,
    lng: number
  ) => void;
}

/**
 * Interactive Leaflet map restricted to continental Colombia (RN-12) showing study area, nodes, and links.
 * @param props - Scenario bounds, deployment nodes, links, and interaction callbacks.
 * @returns Rendered map view with floating overlay for dimensions.
 */
export function ScenarioMap(props: ScenarioMapProps) {
  const {
    bounds,
    accessNodes,
    endNodes,
    links,
    selectedNodeId,
    onSelectNode,
    onMoveNode,
  } = props;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const layerGroupRef = React.useRef<L.LayerGroup | null>(null);

  const dims = boundsDimensionsKm(bounds);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const colombiaBounds = L.latLngBounds([-4.3, -79.15], [12.55, -66.8]);

    try {
      const map = L.map(containerRef.current, {
        center: [4.61, -74.09],
        zoom: 12,
        minZoom: 5,
        maxBounds: colombiaBounds,
        maxBoundsViscosity: 1.0,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const group = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerGroupRef.current = group;
    } catch {
      // Safe fallback in headless test environments where canvas/DOM geometry is partial
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const rectBounds: L.LatLngBoundsExpression = [
      [bounds.south, bounds.west],
      [bounds.north, bounds.east],
    ];
    L.rectangle(rectBounds, {
      color: "#10b981",
      weight: 2,
      fillColor: "#10b981",
      fillOpacity: 0.12,
    }).addTo(group);

    const anMap = new Map(accessNodes.map((an) => [an.id, an]));
    const enMap = new Map(endNodes.map((en) => [en.id, en]));

    for (const lk of links) {
      const an = anMap.get(lk.access_node_id);
      const en = enMap.get(lk.end_node_id);
      if (an && en) {
        L.polyline(
          [
            [en.lat, en.lng],
            [an.lat, an.lng],
          ],
          {
            color: "#38bdf8",
            weight: 2.5,
            dashArray: "6, 4",
          }
        ).addTo(group);
      }
    }

    for (const an of accessNodes) {
      const isSelected = selectedNodeId === an.id;
      const icon = L.divIcon({
        className: "agrowave-access-marker",
        html: `<div style="width:18px;height:18px;border-radius:4px;background:${
          isSelected ? "#f59e0b" : "#10b981"
        };border:2px solid #ffffff;box-shadow:0 0 6px rgba(0,0,0,0.6);" title="${
          an.name
        }"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = L.marker([an.lat, an.lng], {
        icon,
        draggable: Boolean(onMoveNode),
      }).addTo(group);

      marker.bindTooltip(`GW: ${an.name} (${an.height_agl_m} m)`, {
        direction: "top",
      });
      marker.on("click", () => onSelectNode?.(an.id));
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onMoveNode?.(
          "ACCESS_NODE",
          an.id,
          Number(pos.lat.toFixed(5)),
          Number(pos.lng.toFixed(5))
        );
      });
    }

    for (const en of endNodes) {
      const isSelected = selectedNodeId === en.id;
      const icon = L.divIcon({
        className: "agrowave-end-marker",
        html: `<div style="width:14px;height:14px;border-radius:9999px;background:${
          isSelected ? "#f59e0b" : "#38bdf8"
        };border:2px solid #ffffff;box-shadow:0 0 6px rgba(0,0,0,0.6);" title="${
          en.name
        }"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = L.marker([en.lat, en.lng], {
        icon,
        draggable: Boolean(onMoveNode),
      }).addTo(group);

      marker.bindTooltip(`EN: ${en.name} (${en.height_agl_m} m)`, {
        direction: "top",
      });
      marker.on("click", () => onSelectNode?.(en.id));
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onMoveNode?.(
          "END_NODE",
          en.id,
          Number(pos.lat.toFixed(5)),
          Number(pos.lng.toFixed(5))
        );
      });
    }

    try {
      map.fitBounds(rectBounds, { padding: [24, 24] });
    } catch {
      // Ignore fitBounds issues in JSDOM
    }
  }, [bounds, accessNodes, endNodes, links, selectedNodeId, onSelectNode, onMoveNode]);

  return (
    <div className="relative isolate z-0 w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <div
        ref={containerRef}
        data-testid="scenario-leaflet-map"
        className="w-full h-full min-h-[420px] z-0"
      />
      <div className="absolute top-3 right-3 z-[400] rounded-lg bg-slate-900/90 backdrop-blur px-3 py-2 text-xs text-slate-200 border border-slate-700 shadow-lg space-y-1">
        <div className="font-semibold text-emerald-400">
          Colombia Continental (WGS84)
        </div>
        <div>
          Área: ~{dims.widthKm.toFixed(2)} km × ~{dims.heightKm.toFixed(2)} km
        </div>
        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-300">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            Access Node ({accessNodes.length})
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
            End Node ({endNodes.length})
          </span>
        </div>
      </div>
    </div>
  );
}

