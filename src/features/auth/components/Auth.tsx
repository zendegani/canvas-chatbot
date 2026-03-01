import React from "react";
import { Sparkles, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

interface AuthProps {
  view: "signup" | "login";
  setView: (view: "signup" | "login" | "landing") => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (name: string, email: string, password: string) => Promise<void>;
  onSocialLogin: (provider: "google" | "github") => Promise<void>;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

export const Auth: React.FC<AuthProps> = ({
  view,
  setView,
  onLogin,
  onSignup,
  onSocialLogin,
  isDarkMode,
  setIsDarkMode,
}) => {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-muted p-6 md:p-10 relative">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-6 right-6 rounded-full hover:bg-zinc-500/10"
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </Button>

      <div className="w-full max-w-sm md:max-w-4xl flex flex-col items-center gap-6">
        {/* Branding */}
        <button
          onClick={() => setView("landing")}
          className="flex items-center gap-2 font-semibold"
          aria-label="Back to home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Sparkles className="h-4 w-4" />
          </div>
          Canvas AI
        </button>

        {/* Form */}
        {view === "login" ? (
          <LoginForm
            onLogin={onLogin}
            onSocialLogin={onSocialLogin}
            onSwitchToSignup={() => setView("signup")}
          />
        ) : (
          <SignupForm
            onSignup={onSignup}
            onSocialLogin={onSocialLogin}
            onSwitchToLogin={() => setView("login")}
          />
        )}

        {/* Footer */}
        <p className="text-balance text-center text-xs text-muted-foreground px-6">
          By continuing, you agree to our{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};
