'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { PageSelector } from "@/components/PageSelector";
import { PageCard } from "@/components/PageCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { FacebookData, FacebookPage } from "@/types/facebook";
import { apiCache } from "@/utils/cache";

export default function Home() {
  const { data: session } = useSession();
  const [fbData, setFbData] = useState<FacebookData | null>(null);
  const [selectedPages, setSelectedPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError,] = useState<string | null>(null);

  const fetchFacebookData = async () => {
    if (session?.accessToken) {
      setLoading(true);
      setError(null);
      try {
        const cachedData = apiCache.get<FacebookData>("facebook_data");
        if (cachedData) {
          setFbData(cachedData);
          setLoading(false);
          return;
        }

        const response = await fetch("/api/facebook/pages");
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setFbData(data);
        apiCache.set("facebook_data", data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch Facebook data");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFacebookData();
  }, [session]);

  const handlePagesSelected = useCallback((pages: FacebookPage[]) => {
    setSelectedPages(pages);
    // Save selected pages to localStorage for persistence
    localStorage.setItem('selectedFacebookPages', JSON.stringify(pages.map(p => p.id)));
  }, []);

  // Load previously selected pages from localStorage
  useEffect(() => {
    if (fbData?.pages) {
      const savedPageIds = JSON.parse(localStorage.getItem('selectedFacebookPages') || '[]');
      const savedPages = fbData.pages.filter(page => savedPageIds.includes(page.id));
      setSelectedPages(savedPages);
    }
  }, [fbData?.pages]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Welcome to Facebook Page Manager</h1>
          <p className="text-gray-600 mb-8">Please sign in to manage your Facebook pages</p>
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
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchFacebookData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {fbData && (
        <>
          <div className="mb-8">
            <PageSelector
              pages={fbData.pages}
              onPagesSelected={handlePagesSelected}
            />
          </div>
          
          {selectedPages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedPages.map(page => (
                <PageCard key={page.id} page={page} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Select pages above to start managing them</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
