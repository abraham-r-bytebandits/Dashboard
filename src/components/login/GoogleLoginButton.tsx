import { useEffect, useCallback } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement | null,
            config: { theme: string; size: string; width: string }
          ) => void;
        };
      };
    };
  }
}

const CLIENT_ID =
  "3056590140-6pdu8r2691opggq3fgh314h4oppk2qa0.apps.googleusercontent.com";

const GoogleLoginButton = () => {
  const { onAuthSuccess } = useAuth();

  const handleCallback = useCallback(
    async (response: { credential: string }) => {
      try {
        const res = await api.post("/auth/google", {
          credential: response.credential,
        });
        const { accessToken, refreshToken } = res.data;
        // Uses context to update state seamlessly — no page reload
        await onAuthSuccess(accessToken, refreshToken, true);
      } catch {
        alert("Google login failed. Please try again.");
      }
    },
    [onAuthSuccess]
  );

  useEffect(() => {
    // The GSI script loads asynchronously, so poll until window.google is ready
    let attempts = 0;
    const maxAttempts = 20; // wait up to ~2 seconds

    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCallback,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleButton"),
          { theme: "outline", size: "large", width: "100%" }
        );
        return;
      }
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(initGoogle, 100);
      }
    };

    initGoogle();
  }, [handleCallback]);

  return (
    <div className="w-full">
      <div id="googleButton" className="flex w-full justify-center" />
    </div>
  );
};

export default GoogleLoginButton;
