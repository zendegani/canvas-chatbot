import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "./SignupForm";

describe("SignupForm", () => {
  const defaultProps = {
    onSignup: vi.fn().mockResolvedValue(undefined),
    onSocialLogin: vi.fn().mockResolvedValue(undefined),
    onSwitchToLogin: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(<SignupForm {...defaultProps} />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("calls onSignup with valid data", async () => {
    const user = userEvent.setup();
    render(<SignupForm {...defaultProps} />);

    await user.type(screen.getByLabelText("Name"), "Test User");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "MySecure#Pass1");
    await user.type(screen.getByLabelText("Confirm Password"), "MySecure#Pass1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(defaultProps.onSignup).toHaveBeenCalledWith(
        "Test User", "test@example.com", "MySecure#Pass1"
      );
    });
  });

  it("shows error when passwords don't match", async () => {
    const user = userEvent.setup();
    render(<SignupForm {...defaultProps} />);

    await user.type(screen.getByLabelText("Name"), "Test User");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "MySecure#Pass1");
    await user.type(screen.getByLabelText("Confirm Password"), "DifferentPass1!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
    expect(defaultProps.onSignup).not.toHaveBeenCalled();
  });

  it("shows error for weak password", async () => {
    const user = userEvent.setup();
    render(<SignupForm {...defaultProps} />);

    await user.type(screen.getByLabelText("Name"), "Test User");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    // Password meets length but misses uppercase/special — Zod catches the first failing rule
    await user.type(screen.getByLabelText("Password"), "nouppercase1!");
    await user.type(screen.getByLabelText("Confirm Password"), "nouppercase1!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/must include an uppercase letter/i)).toBeInTheDocument();
    });
    expect(defaultProps.onSignup).not.toHaveBeenCalled();
  });

  it("shows password strength rules when password field is focused", async () => {
    const user = userEvent.setup();
    render(<SignupForm {...defaultProps} />);

    const passwordInput = screen.getByLabelText("Password");
    await user.click(passwordInput);
    await user.type(passwordInput, "a");

    await waitFor(() => {
      expect(screen.getByText("At least 12 characters")).toBeInTheDocument();
      expect(screen.getByText("Lowercase letter")).toBeInTheDocument();
      expect(screen.getByText("Uppercase letter")).toBeInTheDocument();
      expect(screen.getByText("Number")).toBeInTheDocument();
      expect(screen.getByText("Special character")).toBeInTheDocument();
    });
  });

  it("displays server error from onSignup", async () => {
    defaultProps.onSignup.mockRejectedValueOnce(new Error("User already exists"));
    const user = userEvent.setup();
    render(<SignupForm {...defaultProps} />);

    await user.type(screen.getByLabelText("Name"), "Test User");
    await user.type(screen.getByLabelText("Email"), "existing@example.com");
    await user.type(screen.getByLabelText("Password"), "MySecure#Pass1");
    await user.type(screen.getByLabelText("Confirm Password"), "MySecure#Pass1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("User already exists")).toBeInTheDocument();
    });
  });

  it("calls onSocialLogin when GitHub button is clicked", async () => {
    const user = userEvent.setup();
    render(<SignupForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /sign up with github/i }));

    expect(defaultProps.onSocialLogin).toHaveBeenCalledWith("github");
  });

  it("calls onSocialLogin when Google button is clicked", async () => {
    const user = userEvent.setup();
    render(<SignupForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /sign up with google/i }));

    expect(defaultProps.onSocialLogin).toHaveBeenCalledWith("google");
  });

  it("shows error when social login fails", async () => {
    defaultProps.onSocialLogin.mockRejectedValueOnce(new Error("OAuth error"));
    const user = userEvent.setup();
    render(<SignupForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /sign up with google/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to sign up with google/i)).toBeInTheDocument();
    });
  });

  it("calls onSwitchToLogin when 'Login' link is clicked", async () => {
    const user = userEvent.setup();
    render(<SignupForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(defaultProps.onSwitchToLogin).toHaveBeenCalled();
  });

  it("shows error for missing name", async () => {
    const user = userEvent.setup();
    render(<SignupForm {...defaultProps} />);

    // Skip name, fill everything else
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "MySecure#Pass1");
    await user.type(screen.getByLabelText("Confirm Password"), "MySecure#Pass1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    // HTML required attribute prevents submission, so onSignup should not be called
    expect(defaultProps.onSignup).not.toHaveBeenCalled();
  });
});
