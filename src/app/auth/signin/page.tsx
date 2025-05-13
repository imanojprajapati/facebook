"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { FaFacebook } from "react-icons/fa";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useState, useEffect } from "react";
import { errorReporter } from "@/utils/error-reporting";

function SignInContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      switch (error) {
        case "Configuration":
          setError("Server configuration error. Please try again later.");
          break;
        case "AccessDenied":
          setError("Please grant all required permissions to manage your Facebook pages.");
          break;
        case "OAuthSignin":
          setError("Unable to connect to Facebook. Please check your internet connection.");
          break;
        case "OAuthCallback":
          setError("Facebook login was interrupted. Please try again.");
          break;
        default:
          setError("An error occurred during sign in. Please try again.");
      }
    }
  }, [searchParams]);

  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);      const result = await signIn("facebook", {
        callbackUrl,
        redirect: true,
        scope: 'pages_show_list,leads_retrieval,pages_read_engagement,pages_manage_leads'
      });

    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to connect with Facebook. Please try again.");
      errorReporter.report(error instanceof Error ? error : new Error("Sign in failed"), {
        type: 'signin_error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome
          </h1>
          <p className="text-gray-600">
            Sign in with Facebook to manage your pages and leads
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleFacebookLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 rounded-lg text-white bg-[#1877f2] hover:bg-[#166fe5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="w-5 h-5 mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <FaFacebook className="w-5 h-5 mr-2" />
              Continue with Facebook
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SignInContent />
    </Suspense>
  );
}