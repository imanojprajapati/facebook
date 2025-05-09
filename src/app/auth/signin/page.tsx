"use client";

import { signIn } from "next-auth/react";
import { FaFacebook } from "react-icons/fa";
import { useState } from "react";

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true);
      const result = await signIn("facebook", { 
        callbackUrl: "/",
        redirect: true
      });
      console.log("SignIn result:", result);
    } catch (error) {
      console.error("SignIn error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Connect your Facebook account to continue</p>
        </div>

        <button
          onClick={handleFacebookLogin}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-3 ${
            isLoading ? 'bg-gray-400' : 'bg-facebook hover:bg-facebook-hover'
          } text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg`}
        >
          <FaFacebook size={24} />
          <span className="font-semibold">
            {isLoading ? 'Connecting...' : 'Continue with Facebook'}
          </span>
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>By continuing, you agree to our</p>
          <a href="/privacy-policy" className="text-facebook hover:text-facebook-hover underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}