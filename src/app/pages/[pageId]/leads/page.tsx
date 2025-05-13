'use client';

import { useSession, signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Link from "next/link";

interface LeadField {
  name: string;
  values: string[];
}

interface Lead {
  id: string;
  created_time: string;
  field_data: LeadField[];
}

interface LeadForm {
  id: string;
  name: string;
  status: string;
  leads_count: number;
  created_time: string;
}

export default function PageLeads() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forms, setForms] = useState<LeadForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pageName, setPageName] = useState<string>("");

  // Step 1: Handle Facebook Login
  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('facebook', {
        callbackUrl: window.location.href,
        scope: 'pages_show_list,leads_retrieval,pages_read_engagement,pages_manage_leads,pages_manage_ads'
      });
    }
  }, [status]);

  // Step 2: Fetch Lead Forms when authenticated
  useEffect(() => {
    const fetchForms = async () => {
      if (!session?.accessToken) return;
      
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/facebook/leads/${pageId}/forms`);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details || 'Failed to fetch forms');
        }
        
        const data = await response.json();
        console.log('📊 Lead Forms Data:', data);
        
        setForms(data.forms);
        setPageName(data.page?.name || "");
        if (data.forms.length > 0) {
          setSelectedForm(data.forms[0].id);
        }
      } catch (err) {
        console.error('Error fetching forms:', err);
        setError(err instanceof Error ? err.message : 'Failed to load forms');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [session, pageId]);

  // Step 3: Fetch Leads when form is selected
  useEffect(() => {
    const fetchLeads = async () => {
      if (!selectedForm || !session?.accessToken) return;
      
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/facebook/leads/${pageId}/forms/${selectedForm}/leads`);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details || 'Failed to fetch leads');
        }
        
        const data = await response.json();
        console.log('📝 Leads Data:', data);
        
        setLeads(data.leads);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leads');
      } finally {
        setLoading(false);
      }
    };

    if (selectedForm) {
      fetchLeads();
    }
  }, [selectedForm, session, pageId]);

  if (status === 'loading' || loading) {
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
            href="/pages/selected"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to pages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link 
          href="/pages/selected"
          className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
        >
          ← Back to pages
        </Link>
        <h1 className="text-2xl font-bold mb-2">
          {pageName} - Lead Center
        </h1>
      </div>

      {/* Form Selection */}
      <div className="mb-8">
        <label htmlFor="form-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select a Lead Form
        </label>
        <select
          id="form-select"
          value={selectedForm || ''}
          onChange={(e) => setSelectedForm(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select a form...</option>
          {forms.map((form) => (
            <option key={form.id} value={form.id}>
              {form.name} ({form.leads_count} leads)
            </option>
          ))}
        </select>
      </div>

      {/* Leads Table */}
      {leads.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {leads[0].field_data.map((field) => (
                    <th 
                      key={field.name}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {field.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.created_time).toLocaleString()}
                    </td>
                    {lead.field_data.map((field) => (
                      <td 
                        key={field.name}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {field.values.join(', ')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedForm ? (
        <div className="text-center py-8 text-gray-500">
          No leads found for this form.
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Select a form to view leads.
        </div>
      )}
    </div>
  );
}
