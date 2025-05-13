'use client';

import { Suspense } from 'react';
import { FaExclamationTriangle, FaHome, FaFacebook } from 'react-icons/fa';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// Error solutions mapping
const errorSolutions: Record<string, string[]> = {  permissions: [
    'You need to grant additional permissions:',
    '1. For the Facebook App:',
    '   • Pages Show List',
    '   • Leads Retrieval',
    '   • Pages Read Engagement',
    '2. For each Facebook Page:',
    '   • Access Lead Gen (grant this in Facebook Page Settings)',
    'Steps to fix:',
    '1. Log out of Facebook completely',
    '2. Sign in again and accept all permissions',
    '3. Go to each Facebook Page > Settings > Tasks > Lead Access',
    '4. Enable "Access Lead Gen" for your account'
  ],
  invalid_token: [
    'Your Facebook session has expired',
    'Please log out and log back in',
    'Make sure you\'re using the same Facebook account'
  ],
  AccessDenied: [
    'Make sure to accept all required Facebook permissions',
    'Your Facebook account must be an admin of the pages you want to manage',
    'Try logging out of Facebook completely and logging back in'
  ],
  Callback: [
    'Clear your browser cookies and cache',
    'Try using a different browser',
    'Check if you have any browser extensions blocking Facebook'
  ],
  OAuthSignin: [
    'Enable cookies in your browser',
    'Disable any ad blockers or privacy extensions',
    'Try using a private/incognito window'
  ],
  default: [
    'Try logging in again',
    'Make sure you\'re using a supported browser',
    'Contact support if the issue persists'
  ]
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [solutions, setSolutions] = useState<string[]>([]);

  useEffect(() => {
    const error = searchParams.get('error');
    let message = 'An authentication error occurred';    switch (error) {
      case 'permissions':
        message = 'Missing required Facebook permissions';
        break;
      case 'invalid_token':
        message = 'Your Facebook session is invalid';
        break;
      case 'token_validation':
        message = 'Could not validate Facebook access';
        break;
      case 'AccessDenied':
        message = 'Facebook permissions were not granted';
        break;
      case 'Callback':
        message = 'Error connecting to Facebook';
        break;
      case 'OAuthSignin':
        message = 'Could not start Facebook login';
        break;
      case 'OAuthCallback':
        message = 'Facebook login was interrupted';
        break;
      case 'TokenError':
        message = 'Your session has expired';
        break;
      default:
        if (error) {
          message = error;
        }
    }

    setErrorMessage(message);
    setSolutions(errorSolutions[error as keyof typeof errorSolutions] || errorSolutions.default);
  }, [searchParams]);

  const handleTryAgain = () => {
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-center mb-6">
          <FaExclamationTriangle className="text-5xl text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-center">Authentication Error</h1>
        <p className="text-gray-600 mb-6 text-center">{errorMessage}</p>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Try these solutions:</h2>
          <ul className="list-disc pl-5 space-y-2">
            {solutions.map((solution, index) => (
              <li key={index} className="text-gray-600">{solution}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleTryAgain}
            className="flex items-center justify-center w-full bg-[#1877f2] text-white py-2 px-4 rounded-lg hover:bg-[#166fe5] transition-colors"
          >
            <FaFacebook className="mr-2" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FaHome className="mr-2" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorContent />
    </Suspense>
  );
}