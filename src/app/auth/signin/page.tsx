"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { FaFacebook } from "react-icons/fa";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useState, useEffect } from "react";
import { errorReporter } from "@/utils/error-reporting";

const REQUIRED_PERMISSIONS = [
  "email",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "leads_retrieval",
  "pages_manage_ads",
  "public_profile"
];

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
        case "CredentialsSignin":
          setError("Unable to verify your Facebook credentials.");
          break;
        default:
          setError("An error occurred during sign in. Please try again.");
      }
    }
  }, [searchParams]);
  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Log the exact URL being used
      console.log('Current URL:', window.location.href);
      console.log('Callback URL:', new URL('/api/auth/callback/facebook', window.location.origin).href);
      
      const result = await signIn("facebook", { 
        callbackUrl,
        redirect: true // Changed to true for direct redirection
      });

      if (result?.error) {
        setError("Failed to connect with Facebook. Please ensure you grant all required permissions.");
        errorReporter.report(new Error(result.error), {
          type: 'auth_error',
          context: 'signin_page'
        });
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      console.error("SignIn error:", error);
      setError("An unexpected error occurred. Please try again.");
      errorReporter.report(error as Error, {
        type: 'auth_error',
        context: 'signin_page'
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
            Welcome to Facebook Pages Manager
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

        <div className="space-y-4">
          <button
            onClick={handleFacebookLogin}
            disabled={isLoading}
            className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-white bg-[#1877f2] hover:bg-[#166fe5] transition-colors ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
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

          <p className="text-sm text-gray-500 text-center">
            By continuing, you agree to our{" "}
            <Link href="/privacy-policy" className="text-[#1877f2] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Required Permissions:</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>View and manage your Facebook Pages</li>
            <li>Access page insights and engagement data</li>
            <li>Manage page metadata and settings</li>
            <li>Access and manage leads information</li>
            <li>Manage page ads and campaigns</li>
          </ul>
        </div>
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