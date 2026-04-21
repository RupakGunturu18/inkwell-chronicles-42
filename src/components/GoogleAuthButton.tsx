import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleAuthButtonProps {
  mode: "signin" | "signup";
}

export const GoogleAuthButton = ({ mode }: GoogleAuthButtonProps) => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const buttonText = useMemo(
    () => (mode === "signin" ? "continue_with" : "signup_with"),
    [mode]
  );

  useEffect(() => {
    const existingScript = document.getElementById("google-identity-script") as HTMLScriptElement | null;

    if (existingScript) {
      if (window.google?.accounts?.id) {
        setScriptReady(true);
      } else {
        existingScript.addEventListener("load", () => setScriptReady(true), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptReady || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential?: string }) => {
        if (!response?.credential) {
          toast.error("Google login failed");
          return;
        }

        try {
          await loginWithGoogle(response.credential);
          toast.success(mode === "signin" ? "Welcome back!" : "Account created with Google!");
          navigate("/");
        } catch (error: any) {
          toast.error(error?.response?.data?.message || "Google login failed");
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: buttonText,
      width: 380,
    });
  }, [scriptReady, buttonText, loginWithGoogle, mode, navigate]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return null;
  }

  return <div ref={buttonRef} className="w-full" />;
};
