import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  const defaultProps = {
    onLogin: vi.fn().mockResolvedValue(undefined),
    onSocialLogin: vi.fn().mockResolvedValue(undefined),
    onSwitchToSignup: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields and headings", () => {
    render(<LoginForm {...defaultProps} />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    // Use getByRole with type=submit to distinguish from the "Login" link at the bottom
    expect(screen.getByRole("button", { name: /^login$/i })).toHaveAttribute("type", "submit");
  });

  it("renders social login buttons", () => {
    render(<LoginForm {...defaultProps} />);

    expect(screen.getByRole("button", { name: /login with github/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login with google/i })).toBeInTheDocument();
  });

  it("calls onLogin with email and password on valid submit", async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "mypassword");

    const submitBtn = screen.getByRole("button", { name: /^login$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(defaultProps.onLogin).toHaveBeenCalledWith("test@example.com", "mypassword");
    });
  });

  it("does not submit when required email is empty", async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    await user.type(screen.getByLabelText("Password"), "somepassword");
    const submitBtn = screen.getByRole("button", { name: /^login$/i });
    await user.click(submitBtn);

    // HTML required attribute prevents submission
    expect(defaultProps.onLogin).not.toHaveBeenCalled();
  });

  it("displays server error from onLogin", async () => {
    defaultProps.onLogin.mockRejectedValueOnce(new Error("Invalid credentials"));
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    const submitBtn = screen.getByRole("button", { name: /^login$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("displays generic error for non-Error throws", async () => {
    defaultProps.onLogin.mockRejectedValueOnce("string error");
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    const submitBtn = screen.getByRole("button", { name: /^login$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Login failed")).toBeInTheDocument();
    });
  });

  it("calls onSocialLogin when GitHub button is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /login with github/i }));

    expect(defaultProps.onSocialLogin).toHaveBeenCalledWith("github");
  });

  it("calls onSocialLogin when Google button is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /login with google/i }));

    expect(defaultProps.onSocialLogin).toHaveBeenCalledWith("google");
  });

  it("shows error when social login fails", async () => {
    defaultProps.onSocialLogin.mockRejectedValueOnce(new Error("OAuth error"));
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /login with github/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to sign in with github/i)).toBeInTheDocument();
    });
  });

  it("calls onSwitchToSignup when 'Sign up' link is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(defaultProps.onSwitchToSignup).toHaveBeenCalled();
  });
});
