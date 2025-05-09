"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FaFacebook } from "react-icons/fa";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "You denied access to your Facebook account.";
      case "OAuthSignin":
        return "Error in constructing the Facebook authorization URL.";
      case "OAuthCallback":
        return "Error in handling the response from Facebook.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h1>
          <p className="text-gray-600">{getErrorMessage(error || "")}</p>
        </div>

        <button
          onClick={() => signIn("facebook", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-3 bg-facebook hover:bg-facebook-hover text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <FaFacebook size={24} />
          <span className="font-semibold">Try Again with Facebook</span>
        </button>
      </div>
    </div>
  );
}