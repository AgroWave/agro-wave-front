import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { App } from "../../app/App";
import { t } from "../../i18n";

describe("AC-01-11 auth pages and form validations", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.pushState({}, "", "/login");
    vi.restoreAllMocks();
  });

  it("renders login form by default and validates invalid email", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: t("auth.login_title") })).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: t("auth.login_button") });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(t("auth.validation.email_invalid"))).toBeInTheDocument();
  });

  it("navigates to registration and validates password confirmation mismatch", async () => {
    render(<App />);

    const registerLink = screen.getByRole("button", { name: t("auth.register_button") });
    fireEvent.click(registerLink);

    expect(screen.getByRole("heading", { name: t("auth.register_title") })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(t("auth.name_label")), { target: { value: "Juan Pérez" } });
    fireEvent.change(screen.getByLabelText(t("auth.email_label")), { target: { value: "juan@example.com" } });
    fireEvent.change(screen.getByLabelText(t("auth.password_label")), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByLabelText(t("auth.confirm_password_label")), { target: { value: "MismatchPassword!" } });

    const submitBtn = screen.getByRole("button", { name: t("auth.register_button") });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(t("auth.validation.passwords_mismatch"))).toBeInTheDocument();
  });

  it("displays server error message translated in Spanish on login failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ code: "InvalidCredentials", detail: "Invalid email or password" }),
    } as Response);

    render(<App />);

    fireEvent.change(screen.getByLabelText(t("auth.email_label")), { target: { value: "wrong@example.com" } });
    fireEvent.change(screen.getByLabelText(t("auth.password_label")), { target: { value: "WrongPassword123!" } });

    const submitBtn = screen.getByRole("button", { name: t("auth.login_button") });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(t("auth.errors.InvalidCredentials"))).toBeInTheDocument();
  });

  it("handles forgot-password flow with success notification", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Sent" }),
    } as Response);

    render(<App />);

    const forgotLink = screen.getByText(t("auth.forgot_password_link"));
    fireEvent.click(forgotLink);

    expect(screen.getByRole("heading", { name: t("auth.forgot_password_title") })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(t("auth.email_label")), { target: { value: "user@example.com" } });
    const sendBtn = screen.getByRole("button", { name: t("auth.send_reset_link_button") });
    fireEvent.click(sendBtn);

    expect(await screen.findByText(t("auth.reset_request_success"))).toBeInTheDocument();
  });

  it("renders reset-password route and processes new password submission", async () => {
    window.history.pushState({}, "", "/reset-password/sample-reset-token-123");
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Password reset successfully" }),
    } as Response);

    render(<App />);

    expect(screen.getByRole("heading", { name: t("auth.reset_password_title") })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(t("auth.new_password_label")), { target: { value: "NewStrongPassword123!" } });
    fireEvent.change(screen.getByLabelText(t("auth.confirm_password_label")), { target: { value: "NewStrongPassword123!" } });

    const submitBtn = screen.getByRole("button", { name: t("auth.reset_password_button") });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(t("auth.reset_success"))).toBeInTheDocument();
  });

  it("renders confirm-email route and confirms account on mount", async () => {
    window.history.pushState({}, "", "/confirm-email/sample-confirm-token-456");
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Email confirmed successfully" }),
    } as Response);

    render(<App />);

    expect(screen.getByRole("heading", { name: t("auth.confirm_email_title") })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(t("auth.confirm_success"))).toBeInTheDocument();
    });
  });
});
