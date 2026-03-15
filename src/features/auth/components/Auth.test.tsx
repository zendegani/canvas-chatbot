import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Auth } from "./Auth";

describe("Auth", () => {
  const defaultProps = {
    view: "login" as const,
    setView: vi.fn(),
    onLogin: vi.fn().mockResolvedValue(undefined),
    onSignup: vi.fn().mockResolvedValue(undefined),
    onSocialLogin: vi.fn().mockResolvedValue(undefined),
    isDarkMode: false,
    setIsDarkMode: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders LoginForm when view is login", () => {
    render(<Auth {...defaultProps} view="login" />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("renders SignupForm when view is signup", () => {
    render(<Auth {...defaultProps} view="signup" />);

    expect(screen.getByText("Create an account")).toBeInTheDocument();
  });

  it("displays Canvas AI branding", () => {
    render(<Auth {...defaultProps} />);

    expect(screen.getByText("Canvas AI")).toBeInTheDocument();
  });

  it("navigates to landing when branding is clicked", async () => {
    const user = userEvent.setup();
    render(<Auth {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /back to home/i }));

    expect(defaultProps.setView).toHaveBeenCalledWith("landing");
  });

  it("renders theme toggle button", async () => {
    const user = userEvent.setup();
    render(<Auth {...defaultProps} isDarkMode={false} />);

    const toggle = screen.getByRole("button", { name: /switch to dark mode/i });
    await user.click(toggle);

    expect(defaultProps.setIsDarkMode).toHaveBeenCalledWith(true);
  });

  it("renders Terms of Service and Privacy Policy links", () => {
    render(<Auth {...defaultProps} />);

    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });
});
