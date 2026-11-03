import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import { t } from "../../i18n";

const mockUser = {
  id: "user-123",
  name: "Juan Pérez",
  email: "juan@example.com",
  role: "USER",
  email_confirmed: true,
};

const mockProfiles = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "LoRaWAN SF12",
    technology: "LORAWAN",
    reference_sensitivity_dbm: -137.0,
    bands: [{ code: "902-928", min_mhz: 902.0, max_mhz: 928.0 }],
    spreading_factor: 12,
    owner_id: null,
    is_predefined: true,
    created_at: "2026-11-01T00:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Mi Perfil Propio",
    technology: "NB_IOT",
    reference_sensitivity_dbm: -130.0,
    bands: [{ code: "B1", min_mhz: null, max_mhz: null }],
    spreading_factor: null,
    owner_id: "user-123",
    is_predefined: false,
    created_at: "2026-11-02T00:00:00Z",
  },
];

const mockTemplates = [
  {
    id: "template-1",
    technology: "NB_IOT",
    role: "ACCESS_NODE",
    name: "NB-IoT access node",
    module_ref: null,
    antenna: {
      reference: null,
      gain_dbi: null,
      polarization: null,
    },
    tx_power: null,
  },
];

describe("AC-02-11 profiles list and actions", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("agrowave_token", "test-token");
    sessionStorage.setItem("agrowave_user", JSON.stringify(mockUser));
    window.history.pushState({}, "", "/profiles");
    vi.restoreAllMocks();
  });

  it("test_ac02_11_renders_appshell_navigation_and_user_info", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes("/api/v1/profiles")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockProfiles,
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });

    render(<App />);

    // AppShell navigation items
    expect(screen.getByRole("link", { name: new RegExp(t("nav.simulations"), "i") })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(t("nav.scenarios"), "i") })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(t("nav.dem"), "i") })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(t("nav.profiles"), "i") })).toBeInTheDocument();

    // User info and logout button
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText(t("auth.logout_button"))).toBeInTheDocument();
  });

  it("test_ac02_11_lists_profiles_with_actions_and_pending_indicators", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const u = url.toString();
      if (u.includes("/node-templates")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockTemplates,
        } as Response;
      }
      if (u.includes("/api/v1/profiles")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockProfiles,
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });

    render(<App />);

    // Wait for profiles to load
    await waitFor(() => {
      expect(screen.getByText("LoRaWAN SF12")).toBeInTheDocument();
      expect(screen.getByText("Mi Perfil Propio")).toBeInTheDocument();
    });

    // Reference sensitivities display "por verificar"
    const verifiedLabels = screen.getAllByText(new RegExp(t("profiles.to_verify"), "i"));
    expect(verifiedLabels.length).toBeGreaterThan(0);

    // Predefined profile card has Duplicate action, but NOT Edit or Delete
    const predefinedCard = screen.getByTestId("profile-card-00000000-0000-0000-0000-000000000001");
    expect(predefinedCard).toHaveTextContent(t("profiles.duplicate_action"));
    expect(predefinedCard).not.toHaveTextContent(t("profiles.edit_action"));
    expect(predefinedCard).not.toHaveTextContent(t("profiles.delete_action"));

    // Own profile card has Duplicate, Edit, and Delete actions
    const ownCard = screen.getByTestId("profile-card-11111111-1111-1111-1111-111111111111");
    expect(ownCard).toHaveTextContent(t("profiles.duplicate_action"));
    expect(ownCard).toHaveTextContent(t("profiles.edit_action"));
    expect(ownCard).toHaveTextContent(t("profiles.delete_action"));

    // Click on view templates for the own profile
    const viewTemplatesBtn = screen.getByTestId("view-templates-11111111-1111-1111-1111-111111111111");
    fireEvent.click(viewTemplatesBtn);

    // Template fields in null must display "pendiente"
    await waitFor(() => {
      expect(screen.getByText("NB-IoT access node")).toBeInTheDocument();
      const pendingBadges = screen.getAllByText(t("profiles.pending"));
      expect(pendingBadges.length).toBeGreaterThan(0);
    });
  });
});
