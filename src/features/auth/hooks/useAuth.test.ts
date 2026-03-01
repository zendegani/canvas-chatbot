import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "./useAuth";

// Mock the auth client module
const mockUseSession = vi.fn();
const mockSignUpEmail = vi.fn();
const mockSignInEmail = vi.fn();
const mockSignInSocial = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => mockUseSession(),
    signUp: { email: (data: any) => mockSignUpEmail(data) },
    signIn: {
      email: (data: any) => mockSignInEmail(data),
      social: (data: any) => mockSignInSocial(data),
    },
    signOut: () => mockSignOut(),
  },
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("shows loading while session is pending", () => {
      mockUseSession.mockReturnValue({ data: null, isPending: true });
      const { result } = renderHook(() => useAuth());

      expect(result.current.view).toBe("loading");
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.isPending).toBe(true);
    });

    it("navigates to landing when no session", async () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.view).toBe("landing");
      });
      expect(result.current.isLoggedIn).toBe(false);
      expect(result.current.currentUser).toBe("");
    });

    it("navigates to canvas when session exists", async () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: "user@example.com", name: "Test" } },
        isPending: false,
      });
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.view).toBe("canvas");
      });
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.currentUser).toBe("user@example.com");
    });
  });

  describe("handleLoginSubmit", () => {
    it("navigates to canvas on successful login", async () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });
      mockSignInEmail.mockResolvedValue({ data: {}, error: null });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => expect(result.current.view).toBe("landing"));

      await act(async () => {
        await result.current.handleLoginSubmit("user@example.com", "Password1!");
      });

      expect(mockSignInEmail).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password1!",
      });
      expect(result.current.view).toBe("canvas");
    });

    it("throws on login error", async () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });
      mockSignInEmail.mockResolvedValue({
        data: null,
        error: { message: "Invalid credentials" },
      });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.view).toBe("landing"));

      await expect(
        act(() => result.current.handleLoginSubmit("user@example.com", "wrong"))
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("handleSignupSubmit", () => {
    it("navigates to canvas on successful signup", async () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });
      mockSignUpEmail.mockResolvedValue({ data: {}, error: null });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.view).toBe("landing"));

      await act(async () => {
        await result.current.handleSignupSubmit("Test User", "new@example.com", "SecureP@ss123");
      });

      expect(mockSignUpEmail).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "SecureP@ss123",
        name: "Test User",
      });
      expect(result.current.view).toBe("canvas");
    });

    it("throws on signup error", async () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });
      mockSignUpEmail.mockResolvedValue({
        data: null,
        error: { message: "User already exists" },
      });

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.view).toBe("landing"));

      await expect(
        act(() => result.current.handleSignupSubmit("Test", "existing@example.com", "SecureP@ss123"))
      ).rejects.toThrow("User already exists");
    });
  });

  describe("handleLogout", () => {
    it("signs out and returns to login", async () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: "user@example.com" } },
        isPending: false,
      });
      mockSignOut.mockResolvedValue({});

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.view).toBe("canvas"));

      await act(async () => {
        await result.current.handleLogout();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.view).toBe("login");
    });
  });

  describe("handleSocialLogin", () => {
    it("calls signIn.social with correct provider", async () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });
      mockSignInSocial.mockResolvedValue({});

      const { result } = renderHook(() => useAuth());
      await waitFor(() => expect(result.current.view).toBe("landing"));

      await act(async () => {
        await result.current.handleSocialLogin("github");
      });

      expect(mockSignInSocial).toHaveBeenCalledWith({
        provider: "github",
        callbackURL: "/",
      });
    });
  });
});
