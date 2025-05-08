"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { FaFacebook } from "react-icons/fa";

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface Lead {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

interface PageLeads {
  pageId: string;
  leads: Lead[];
}

export default function Home() {
  const { data: session } = useSession();
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<FacebookPage[]>([]);
  const [leads, setLeads] = useState<PageLeads[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      fetchPages();
    }
  }, [session]);

  const fetchPages = async () => {
    try {
      const response = await fetch("/api/facebook/pages");
      const result = await response.json();
      if (result.data) {
        setPages(result.data);
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const togglePageSelection = (page: FacebookPage) => {
    setSelectedPages(prev => {
      const isSelected = prev.some(p => p.id === page.id);
      if (isSelected) {
        return prev.filter(p => p.id !== page.id);
      }
      return [...prev, page];
    });
  };

  const fetchLeads = async () => {
    if (selectedPages.length === 0) {
      alert("Please select at least one page");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/facebook/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageIds: selectedPages.map(page => page.id),
          pageTokens: selectedPages.map(page => page.access_token),
        }),
      });
      
      const result = await response.json();
      if (result.data) {
        setLeads(result.data);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">Facebook Pages Manager</h1>
          <button
            onClick={() => signIn("facebook")}
            className="flex items-center justify-center gap-2 bg-[#1877F2] text-white px-6 py-3 rounded-md hover:bg-[#166FE5] transition-colors"
          >
            <FaFacebook size={24} />
            Sign in with Facebook
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Facebook Pages</h1>
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`bg-white p-4 rounded-lg shadow transition-all ${
                selectedPages.some(p => p.id === page.id)
                  ? "ring-2 ring-blue-500"
                  : ""
              }`}
            >
              <div className="flex items-center gap-4">
                {page.picture && (
                  <img
                    src={page.picture.data.url}
                    alt={page.name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{page.name}</h3>
                </div>
                <button
                  onClick={() => togglePageSelection(page)}
                  className={`px-3 py-1 rounded ${
                    selectedPages.some(p => p.id === page.id)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {selectedPages.some(p => p.id === page.id) ? "Selected" : "Select"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {pages.length > 0 && (
          <div className="text-center mb-8">
            <button
              onClick={fetchLeads}
              disabled={loading || selectedPages.length === 0}
              className={`bg-green-500 text-white px-6 py-3 rounded-md ${
                loading || selectedPages.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-green-600"
              }`}
            >
              {loading ? "Loading..." : "Fetch Leads"}
            </button>
          </div>
        )}

        {leads.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Leads</h2>
            {leads.map((pageLeads) => {
              const page = pages.find(p => p.id === pageLeads.pageId);
              return (
                <div key={pageLeads.pageId} className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">
                    {page?.name || "Unknown Page"}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2">Lead ID</th>
                          <th className="px-4 py-2">Created</th>
                          <th className="px-4 py-2">Information</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageLeads.leads.map((lead) => (
                          <tr key={lead.id} className="border-t">
                            <td className="px-4 py-2">{lead.id}</td>
                            <td className="px-4 py-2">
                              {new Date(lead.created_time).toLocaleString()}
                            </td>
                            <td className="px-4 py-2">
                              <ul>
                                {lead.field_data.map((field, i) => (
                                  <li key={i}>
                                    <strong>{field.name}:</strong>{" "}
                                    {field.values.join(", ")}
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
