import { useState, useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { ViewState } from "../types";

interface UseAuthReturn {
  isLoggedIn: boolean;
  isPending: boolean;
  currentUser: string;
  view: ViewState;
  setView: (view: ViewState) => void;
  handleLoginSubmit: (email: string, password: string) => Promise<void>;
  handleSignupSubmit: (name: string, email: string, password: string) => Promise<void>;
  handleSocialLogin: (provider: "google" | "github") => Promise<void>;
  handleLogout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const { data: session, isPending } = authClient.useSession();
  const [view, setView] = useState<ViewState>("loading");
  const initialCheckDone = useRef(false);

  // On initial load: once the session check finishes, decide where to go.
  // After that, navigation is manual (login/logout/signup handlers set view).
  useEffect(() => {
    if (!isPending && !initialCheckDone.current) {
      initialCheckDone.current = true;
      setView(session ? "canvas" : "landing");
    }
  }, [session, isPending]);

  const handleSignupSubmit = async (name: string, email: string, password: string) => {
    const result = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (result.error) {
      throw new Error(result.error.message ?? "Signup failed");
    }

    setView("canvas");
  };

  const handleLoginSubmit = async (email: string, password: string) => {
    const result = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      throw new Error(result.error.message ?? "Invalid email or password");
    }

    setView("canvas");
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    // This redirects the browser to the OAuth provider.
    // After callback, the page reloads, useSession picks up the session,
    // and the initial-check effect navigates to 'canvas'.
    await authClient.signIn.social({
      provider,
      callbackURL: "/",
    });
  };

  const handleLogout = async () => {
    await authClient.signOut();
    initialCheckDone.current = false;
    setView("landing");
  };

  return {
    isLoggedIn: !!session,
    isPending,
    currentUser: session?.user?.email ?? "",
    view,
    setView,
    handleLoginSubmit,
    handleSignupSubmit,
    handleSocialLogin,
    handleLogout,
  };
};
