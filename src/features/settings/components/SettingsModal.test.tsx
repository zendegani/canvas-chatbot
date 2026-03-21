import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsModal } from "./SettingsModal";
import { PROVIDERS } from "../../canvas/services/providers";

describe("SettingsModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentUser: "test@example.com",
    refreshModels: vi.fn(),
    selectedProvider: 'openrouter' as const,
    onProviderChange: vi.fn(),
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
    expect(screen.getByText("AI Provider")).toBeInTheDocument();
    // All three provider names should be visible as buttons
    expect(screen.getByText("OpenRouter")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Google AI")).toBeInTheDocument();
  });

  it("renders API key inputs for all providers", () => {
    render(<SettingsModal {...defaultProps} />);

    expect(screen.getByText("OpenRouter API Key")).toBeInTheDocument();
    expect(screen.getByText("OpenAI API Key")).toBeInTheDocument();
    expect(screen.getByText("Google AI API Key")).toBeInTheDocument();
  });

  it("loads existing API key from localStorage", () => {
    localStorage.setItem("apiKey_openrouter_test@example.com", "sk-or-existing");

    render(<SettingsModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("sk-or-...");
    expect(input).toHaveValue("sk-or-existing");
  });

  it("saves API keys and closes on Save", async () => {
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} />);

    const input = screen.getByPlaceholderText("sk-or-...");
    await user.type(input, "sk-or-new-key");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(localStorage.getItem("apiKey_openrouter_test@example.com")).toBe("sk-or-new-key");
    expect(defaultProps.refreshModels).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onProviderChange when provider button is clicked", async () => {
    const user = userEvent.setup();
    render(<SettingsModal {...defaultProps} />);

    await user.click(screen.getByText("Google AI"));

    expect(defaultProps.onProviderChange).toHaveBeenCalledWith("google");
  });

  it("renders clear data button in danger zone", () => {
    render(<SettingsModal {...defaultProps} />);

    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear all app data/i })).toBeInTheDocument();
  });
});
