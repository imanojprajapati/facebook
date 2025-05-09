"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { FaFacebook } from "react-icons/fa";
import type { FacebookData, LeadResponse } from "@/types/facebook";
import { apiCache } from "@/utils/cache";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageCard } from "@/components/PageCard";
import Image from "next/image";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";

export default function Home() {
  // Add performance monitoring with component name
  usePerformanceMonitoring("HomePage");

  const { data: session, status } = useSession();
  const [fbData, setFbData] = useState<FacebookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageLeads, setPageLeads] = useState<Record<string, LeadResponse>>({});
  const [loadingLeads, setLoadingLeads] = useState<Record<string, boolean>>({});
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState(-1);

  const shortcuts = useKeyboardShortcuts([
    {
      key: "?",
      description: "Show keyboard shortcuts",
      handler: () => setIsHelpOpen(true)
    },
    {
      key: "j",
      description: "Navigate to next page",
      handler: () => {
        if (fbData?.pages) {
          setSelectedPageIndex(prev => 
            prev < fbData.pages.length - 1 ? prev + 1 : prev
          );
        }
      }
    },
    {
      key: "k",
      description: "Navigate to previous page",
      handler: () => {
        setSelectedPageIndex(prev => prev > 0 ? prev - 1 : prev);
      }
    },
    {
      key: "l",
      description: "Load leads for selected page",
      handler: () => {
        if (fbData?.pages && selectedPageIndex >= 0) {
          const page = fbData.pages[selectedPageIndex];
          if (!pageLeads[page.id] && !loadingLeads[page.id]) {
            fetchLeadsForPage(page.id, page.access_token);
          }
        }
      }
    },
    {
      key: "h",
      description: "Return to home/top",
      handler: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setSelectedPageIndex(-1);
      }
    }
  ]);

  useEffect(() => {
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

    fetchFacebookData();
  }, [session]);

  const fetchLeadsForPage = useCallback(async (pageId: string, pageToken: string) => {
    setLoadingLeads(prev => ({ ...prev, [pageId]: true }));
    try {
      const cacheKey = `leads_${pageId}`;
      const cachedLeads = apiCache.get<LeadResponse>(cacheKey);
      if (cachedLeads) {
        setPageLeads(prev => ({
          ...prev,
          [pageId]: cachedLeads
        }));
        setLoadingLeads(prev => ({ ...prev, [pageId]: false }));
        return;
      }

      const response = await fetch("/api/facebook/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageIds: [pageId],
          pageTokens: [pageToken],
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const pageData = data.data[0];
      setPageLeads(prev => ({
        ...prev,
        [pageId]: pageData
      }));
      apiCache.set(cacheKey, pageData);
    } catch (err) {
      console.error(`Error fetching leads for page ${pageId}:`, err);
      setPageLeads(prev => ({
        ...prev,
        [pageId]: {
          pageId,
          leads: [],
          error: err instanceof Error ? err.message : "Failed to fetch leads"
        }
      }));
    } finally {
      setLoadingLeads(prev => ({ ...prev, [pageId]: false }));
    }
  }, []);

  useEffect(() => {
    if (selectedPageIndex >= 0) {
      const pageElements = document.querySelectorAll('[role="article"]');
      const selectedElement = pageElements[selectedPageIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.focus();
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedPageIndex]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-6">Connect Your Facebook Account</h1>
          <button
            onClick={() => signIn("facebook")}
            className="flex items-center justify-center gap-2 bg-facebook hover:bg-facebook-hover text-white px-6 py-3 rounded-lg w-full transition-colors duration-200"
          >
            <FaFacebook size={24} />
            <span>Connect with Facebook</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <LoadingSpinner size="large" className="my-8" />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        ) : fbData ? (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center gap-4">
                <Image
                  src={fbData.user.picture?.data?.url || ''}
                  alt={fbData.user.name}
                  width={64}
                  height={64}
                  className="rounded-full"
                  priority
                />
                <div>
                  <h2 className="text-2xl font-bold">{fbData.user.name}</h2>
                  <p className="text-gray-600">{fbData.user.email}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Press <kbd className="bg-gray-100 px-2 py-1 rounded">?</kbd> for keyboard shortcuts
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fbData.pages.map((page, index) => (
                <PageCard
                  key={page.id}
                  page={page}
                  leads={pageLeads[page.id]}
                  loadingLeads={loadingLeads[page.id] || false}
                  onLoadLeads={fetchLeadsForPage}
                  isSelected={index === selectedPageIndex}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <KeyboardShortcutsHelp
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
