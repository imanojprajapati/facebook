"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { FaFacebook } from "react-icons/fa";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useState, useEffect } from "react";

// Separate component to use useSearchParams
function SignInContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check for error parameter in URL
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      switch (error) {
        case "Configuration":
          setError("There is a problem with the application configuration.");
          break;
        case "AccessDenied":
          setError("Please grant all required permissions to continue.");
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
      
      const result = await signIn("facebook", { 
        callbackUrl: "/",
        redirect: false
      });

      if (result?.error) {
        setError("Failed to connect with Facebook. Please try again.");
        console.error("SignIn error:", result.error);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      console.error("SignIn error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome to Facebook Pages Manager
          </h1>
          <p className="text-gray-600">
            Connect your Facebook account to manage your pages and leads
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleFacebookLogin}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-3 ${
            isLoading ? 'bg-gray-400' : 'bg-facebook hover:bg-facebook-hover'
          } text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="small" />
              <span className="font-semibold">Connecting...</span>
            </>
          ) : (
            <>
              <FaFacebook size={24} />
              <span className="font-semibold">Continue with Facebook</span>
            </>
          )}
        </button>

        <div className="mt-6 space-y-4">
          <div className="text-center text-sm text-gray-600">
            <p>By continuing, you agree to our{" "}
              <Link 
                href="/privacy-policy" 
                className="text-facebook hover:text-facebook-hover underline"
              >
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>This app requires access to:</p>
            <ul className="mt-2 space-y-1">
              <li>• Your basic profile information</li>
              <li>• List of pages you manage</li>
              <li>• Page engagement metrics</li>
              <li>• Lead form data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function SignIn() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}