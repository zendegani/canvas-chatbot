import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsModal } from "./SettingsModal";

describe("SettingsModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentUser: "test@example.com",
    refreshModels: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders nothing when not open", () => {
    const { container } = render(<SettingsModal {...defaultProps} isOpen={false} />);

    // The component returns null when not open
    expect(container.innerHTML).toBe("");
  });

  it("renders settings dialog when open", () => {
    render(<SettingsModal {...defaultProps} />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("OpenRouter API Key")).toBeInTheDocument();
  });

  it("loads existing API key from localStorage", () => {
    localStorage.setItem("openRouterApiKey_test@example.com", "sk-or-existing");

    render(<SettingsModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("sk-or-...");
    expect(input).toHaveValue("sk-or-existing");
  });

  it("saves API key and closes on Save", async () => {
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("sk-or-...");
    await user.type(input, "sk-or-new-key");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(localStorage.getItem("openRouterApiKey_test@example.com")).toBe("sk-or-new-key");
    expect(defaultProps.refreshModels).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders clear data button in danger zone", () => {
    render(<SettingsModal {...defaultProps} />);

    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear all app data/i })).toBeInTheDocument();
  });
});
