"use client";

import { useUser, SignIn, SignUp } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
}

interface ChatAuthGateProps {
  children: React.ReactNode;
  onAuthenticated?: (user: AuthenticatedUser) => void;
}

export default function ChatAuthGate({ children, onAuthenticated }: ChatAuthGateProps) {
  const { isSignedIn, user, isLoaded } = useUser();
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-up");
  const [showAuth, setShowAuth] = useState(false);
  const hasNotified = useRef(false);

  // Once authenticated, pass user info up (in useEffect to avoid render-loop)
  useEffect(() => {
    if (isLoaded && isSignedIn && user && onAuthenticated && !hasNotified.current) {
      hasNotified.current = true;
      onAuthenticated({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      });
    }
  }, [isLoaded, isSignedIn, user, onAuthenticated]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-white/40 text-sm tracking-widest uppercase animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center px-4">
      {!showAuth ? (
        <div className="space-y-6 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3
            className="text-white/80 text-2xl md:text-3xl font-light"
            style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", letterSpacing: "-0.03em" }}
          >
            Authentication Required
          </h3>
          <p className="text-white/40 text-sm font-light max-w-md">
            Sign in or create an account to start chatting with NOVERA AI. Your identity helps the agent personalize your experience.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="text-[10px] uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-[2px] font-medium transition-all duration-300"
          >
            Get Started
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => setAuthMode("sign-in")}
              className={`text-[10px] uppercase tracking-widest px-4 py-2 border rounded-[2px] transition-all duration-300 ${
                authMode === "sign-in"
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-transparent border-white/20 text-white/50 hover:text-white hover:border-white/40"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode("sign-up")}
              className={`text-[10px] uppercase tracking-widest px-4 py-2 border rounded-[2px] transition-all duration-300 ${
                authMode === "sign-up"
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-transparent border-white/20 text-white/50 hover:text-white hover:border-white/40"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="flex justify-center">
            {authMode === "sign-in" ? (
              <SignIn
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-white/5 backdrop-blur-md border border-white/10 shadow-none",
                    headerTitle: "text-white",
                    headerSubtitle: "text-white/50",
                    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
                    formFieldInput: "bg-white/10 border-white/20 text-white",
                    formFieldLabel: "text-white/60",
                    footerActionLink: "text-indigo-400 hover:text-indigo-300",
                    identityPreview: "bg-white/5 border-white/10",
                    identityPreviewText: "text-white/70",
                    identityPreviewEditButton: "text-indigo-400",
                  },
                }}
              />
            ) : (
              <SignUp
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-white/5 backdrop-blur-md border border-white/10 shadow-none",
                    headerTitle: "text-white",
                    headerSubtitle: "text-white/50",
                    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
                    formFieldInput: "bg-white/10 border-white/20 text-white",
                    formFieldLabel: "text-white/60",
                    footerActionLink: "text-indigo-400 hover:text-indigo-300",
                    identityPreview: "bg-white/5 border-white/10",
                    identityPreviewText: "text-white/70",
                    identityPreviewEditButton: "text-indigo-400",
                  },
                }}
              />
            )}
          </div>

          <button
            onClick={() => setShowAuth(false)}
            className="text-white/30 hover:text-white/60 text-[10px] uppercase tracking-widest transition-colors duration-300"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
