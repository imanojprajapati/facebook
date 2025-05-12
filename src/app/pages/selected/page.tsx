'use client';

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { FacebookPage } from "@/types/facebook";
import Link from "next/link";

function SelectedPagesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSelectedPages = async () => {
      if (!session?.accessToken) return;

      const pageIds = searchParams.get('ids')?.split(',') || [];
      if (pageIds.length === 0) {
        setError('No pages selected');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/facebook/pages');
        if (!response.ok) throw new Error('Failed to fetch pages');
        
        const data = await response.json();
        const selectedPages = data.pages.filter((page: FacebookPage) => 
          pageIds.includes(page.id)
        );
        setPages(selectedPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pages');
      } finally {
        setLoading(false);
      }
    };

    fetchSelectedPages();
  }, [session, searchParams]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Please Sign In</h1>
          <p className="text-gray-600">You need to be signed in to view selected pages</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Go back to page selection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Selected Pages</h1>
        <Link 
          href="/"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to page selection
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        {pages.map((page, index) => (
          <div 
            key={page.id}
            className={`p-4 flex items-center gap-4 ${
              index !== pages.length - 1 ? 'border-b' : ''
            }`}
          >
            {page.picture?.data?.url && (
              <img
                src={page.picture.data.url}
                alt=""
                className="w-12 h-12 rounded-lg flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-medium">{page.name}</h2>
                {page.verification_status === 'verified' && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-500">{page.category}</p>
              <div className="mt-2">
                <span className="text-sm text-gray-600">
                  {page.fan_count?.toLocaleString() || 0} fans
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              {page.link && (
                <a
                  href={page.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View on Facebook →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SelectedPages() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      }
    >
      <SelectedPagesContent />
    </Suspense>
  );
}
