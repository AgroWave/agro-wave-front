import { create } from "zustand";
import {
  DEFAULT_LONGLEY_RICE_PARAMS,
  type AccessNode,
  type EndNode,
  type Link,
  type LongleyRiceParams,
  type Scenario,
} from "../../domain/scenarios";
import type { Bounds } from "../../domain/terrain";

/**
 * Editor step identifier inside ScenarioEditorPage.
 */
export type ScenarioEditorStep =
  | "data"
  | "terrain"
  | "profile"
  | "deployment"
  | "propagation";

/**
 * Zustand state and actions for the scenario editor draft.
 */
export interface ScenarioDraftState {
  activeStep: ScenarioEditorStep;
  selectedNodeId: string | null;
  name: string;
  description: string;
  bounds: Bounds;
  demId: string | null;
  profileId: string | null;
  bandCode: string;
  frequencyMhz: number;
  accessNodes: AccessNode[];
  endNodes: EndNode[];
  links: Link[];
  propagationParams: LongleyRiceParams;
  isDirty: boolean;

  setActiveStep: (step: ScenarioEditorStep) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  resetDraft: () => void;
  loadFromScenario: (scenario: Scenario) => void;
  setMetadata: (name: string, description: string) => void;
  setBounds: (bounds: Bounds) => void;
  setDemId: (demId: string | null) => void;
  setRadioConfig: (
    profileId: string | null,
    bandCode: string,
    frequencyMhz: number
  ) => void;
  addAccessNode: (node: AccessNode) => void;
  updateAccessNode: (id: string, patch: Partial<AccessNode>) => void;
  removeAccessNode: (id: string) => void;
  addEndNodeWithLink: (endNode: EndNode, accessNodeId: string) => void;
  updateEndNode: (id: string, patch: Partial<EndNode>) => void;
  removeEndNode: (id: string) => void;
  setPropagationParams: (patch: Partial<LongleyRiceParams>) => void;
}

const DEFAULT_BOUNDS: Bounds = {
  south: 4.58,
  west: -74.12,
  north: 4.64,
  east: -74.06,
};

/**
 * Zustand store managing the in-progress scenario editor state.
 */
export const useScenarioDraftStore = create<ScenarioDraftState>((set) => ({
  activeStep: "data",
  selectedNodeId: null,
  name: "",
  description: "",
  bounds: DEFAULT_BOUNDS,
  demId: null,
  profileId: null,
  bandCode: "",
  frequencyMhz: 915.0,
  accessNodes: [],
  endNodes: [],
  links: [],
  propagationParams: { ...DEFAULT_LONGLEY_RICE_PARAMS },
  isDirty: false,

  setActiveStep: (step) => set({ activeStep: step }),
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  resetDraft: () =>
    set({
      activeStep: "data",
      selectedNodeId: null,
      name: "Nuevo Escenario",
      description: "",
      bounds: { ...DEFAULT_BOUNDS },
      demId: null,
      profileId: null,
      bandCode: "",
      frequencyMhz: 915.0,
      accessNodes: [],
      endNodes: [],
      links: [],
      propagationParams: { ...DEFAULT_LONGLEY_RICE_PARAMS },
      isDirty: false,
    }),

  loadFromScenario: (scenario) =>
    set({
      name: scenario.name,
      description: scenario.description || "",
      bounds: { ...scenario.bounds },
      demId: scenario.terrain_ref?.dem_id || null,
      profileId: scenario.radio_config?.profile_id || null,
      bandCode: scenario.radio_config?.band_code || "",
      frequencyMhz: scenario.radio_config?.frequency_mhz || 915.0,
      accessNodes: scenario.access_nodes.map((an) => ({ ...an })),
      endNodes: scenario.end_nodes.map((en) => ({ ...en })),
      links: scenario.links.map((lk) => ({ ...lk })),
      propagationParams: scenario.propagation_setup?.parameters
        ? { ...scenario.propagation_setup.parameters }
        : { ...DEFAULT_LONGLEY_RICE_PARAMS },
      isDirty: false,
    }),

  setMetadata: (name, description) =>
    set({ name, description, isDirty: true }),

  setBounds: (bounds) => set({ bounds, isDirty: true }),

  setDemId: (demId) => set({ demId, isDirty: true }),

  setRadioConfig: (profileId, bandCode, frequencyMhz) =>
    set({ profileId, bandCode, frequencyMhz, isDirty: true }),

  addAccessNode: (node) =>
    set((state) => ({
      accessNodes: [...state.accessNodes, node],
      selectedNodeId: node.id,
      isDirty: true,
    })),

  updateAccessNode: (id, patch) =>
    set((state) => ({
      accessNodes: state.accessNodes.map((an) =>
        an.id === id ? { ...an, ...patch } : an
      ),
      isDirty: true,
    })),

  removeAccessNode: (id) =>
    set((state) => {
      const removedEndNodeIds = new Set(
        state.links
          .filter((lk) => lk.access_node_id === id)
          .map((lk) => lk.end_node_id)
      );
      return {
        accessNodes: state.accessNodes.filter((an) => an.id !== id),
        endNodes: state.endNodes.filter((en) => !removedEndNodeIds.has(en.id)),
        links: state.links.filter((lk) => lk.access_node_id !== id),
        selectedNodeId:
          state.selectedNodeId === id ? null : state.selectedNodeId,
        isDirty: true,
      };
    }),

  addEndNodeWithLink: (endNode, accessNodeId) =>
    set((state) => ({
      endNodes: [...state.endNodes, endNode],
      links: [
        ...state.links,
        {
          id: crypto.randomUUID(),
          end_node_id: endNode.id,
          access_node_id: accessNodeId,
        },
      ],
      selectedNodeId: endNode.id,
      isDirty: true,
    })),

  updateEndNode: (id, patch) =>
    set((state) => ({
      endNodes: state.endNodes.map((en) =>
        en.id === id ? { ...en, ...patch } : en
      ),
      isDirty: true,
    })),

  removeEndNode: (id) =>
    set((state) => ({
      endNodes: state.endNodes.filter((en) => en.id !== id),
      links: state.links.filter((lk) => lk.end_node_id !== id),
      selectedNodeId:
        state.selectedNodeId === id ? null : state.selectedNodeId,
      isDirty: true,
    })),

  setPropagationParams: (patch) =>
    set((state) => ({
      propagationParams: { ...state.propagationParams, ...patch },
      isDirty: true,
    })),
}));

