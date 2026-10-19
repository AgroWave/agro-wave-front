import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ApiStatus } from "./ApiStatus";
import { t } from "../../i18n";

describe("AC-00-09: ApiStatus feature", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows available message when API responds with 200 and database ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok", database: "ok" }),
    });

    render(<ApiStatus />);

    await waitFor(() => {
      expect(screen.getByText(t("system.api_available"))).toBeInTheDocument();
    });
  });

  it("shows unavailable message when API call fails or responds with error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<ApiStatus />);

    await waitFor(() => {
      expect(screen.getByText(t("system.api_unavailable"))).toBeInTheDocument();
    });
  });
});
