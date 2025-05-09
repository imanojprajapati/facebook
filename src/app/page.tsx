"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { FaFacebook, FaSpinner } from "react-icons/fa";

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  picture: {
    data: {
      url: string;
    };
  };
  category: string;
  fan_count: number;
  link: string;
  verification_status: string;
}

interface FacebookData {
  user: {
    id: string;
    name: string;
    email: string;
    picture: {
      data: {
        url: string;
      };
    };
  };
  pages: FacebookPage[];
}

export default function Home() {
  const { data: session, status } = useSession();
  const [fbData, setFbData] = useState<FacebookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacebookData = async () => {
      if (session?.accessToken) {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch("/api/facebook/pages");
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }
          setFbData(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to fetch Facebook data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFacebookData();
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-facebook" />
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
          <div className="flex justify-center">
            <FaSpinner className="animate-spin text-4xl text-facebook" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        ) : fbData ? (
          <>
            {/* User Profile Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center gap-4">
                <img
                  src={fbData.user.picture?.data?.url}
                  alt={fbData.user.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h2 className="text-2xl font-bold">{fbData.user.name}</h2>
                  <p className="text-gray-600">{fbData.user.email}</p>
                </div>
              </div>
            </div>

            {/* Facebook Pages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fbData.pages.map((page) => (
                <div key={page.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={page.picture?.data?.url}
                        alt={page.name}
                        className="w-12 h-12 rounded-lg"
                      />
                      <div>
                        <h3 className="font-bold">{page.name}</h3>
                        <p className="text-sm text-gray-600">{page.category}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Likes: {page.fan_count?.toLocaleString()}</p>
                      <p>
                        Status:{" "}
                        <span
                          className={`inline-block px-2 py-1 rounded ${
                            page.verification_status === "verified"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {page.verification_status || "Not verified"}
                        </span>
                      </p>
                    </div>
                    <a
                      href={page.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-facebook hover:text-facebook-hover"
                    >
                      View Page →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
