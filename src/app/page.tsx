"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { FaFacebook } from "react-icons/fa";

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<FacebookPage[]>([]);

  useEffect(() => {
    const fetchPages = async () => {
      if (session?.accessToken) {
        try {
          const response = await fetch("/api/facebook/pages");
          const data = await response.json();
          if (data.data) {
            setPages(data.data);
          }
        } catch (error) {
          console.error("Error fetching pages:", error);
        }
      }
    };

    fetchPages();
  }, [session]);

  const handlePageToggle = (page: FacebookPage) => {
    setSelectedPages(prev => {
      const isSelected = prev.some(p => p.id === page.id);
      if (isSelected) {
        return prev.filter(p => p.id !== page.id);
      } else {
        return [...prev, page];
      }
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">Facebook Pages Manager</h1>
          <button
            onClick={() => signIn("facebook")}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaFacebook className="text-xl" />
            Connect Facebook Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Facebook Pages</h1>
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Disconnect
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {pages.length === 0 ? (
            <p className="text-gray-500">No Facebook pages found.</p>
          ) : (
            <div className="space-y-4">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-medium">{page.name}</h3>
                  </div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedPages.some(p => p.id === page.id)}
                      onChange={() => handlePageToggle(page)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Select</span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {selectedPages.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h2 className="text-xl font-semibold mb-4">Selected Pages</h2>
              <div className="space-y-2">
                {selectedPages.map(page => (
                  <div key={page.id} className="p-3 bg-blue-50 rounded">
                    {page.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
