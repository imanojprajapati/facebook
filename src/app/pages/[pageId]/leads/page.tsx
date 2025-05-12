'use client';

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
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

interface FormLeads {
  form_id: string;
  form_name: string;
  leads: Lead[];
  error?: string;
}

export default function PageLeads() {
  const { data: session } = useSession();
  const params = useParams();
  const pageId = params.pageId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forms, setForms] = useState<LeadForm[]>([]);
  const [leadsData, setLeadsData] = useState<FormLeads[]>([]);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      if (!session?.accessToken) return;
    try {
      const response = await fetch(`/api/facebook/leads/${pageId}`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      console.log('📊 Lead Forms Data:', data.forms);
      console.log('📝 Leads Data:', data.leads);
      
      setForms(data.forms);
      setLeadsData(data.leads);
        if (data.forms.length > 0) {
          setSelectedForm(data.forms[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [session, pageId]);

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
            href="/pages/selected"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to pages
          </Link>
        </div>
      </div>
    );
  }

  const selectedFormData = leadsData.find(d => d.form_id === selectedForm);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Page Leads</h1>
        <Link 
          href="/pages/selected"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to pages
        </Link>
      </div>

      {forms.length > 0 ? (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Lead Form
            </label>
            <select
              value={selectedForm || ''}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {forms.map(form => (
                <option key={form.id} value={form.id}>
                  {form.name} ({form.leads_count} leads)
                </option>
              ))}
            </select>
          </div>

          {selectedFormData && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedFormData.form_name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedFormData.leads.length} leads found
                </p>
              </div>

              {selectedFormData.leads.length > 0 ? (
                <div className="border-t border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          {selectedFormData.leads[0].field_data.map(field => (
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
                        {selectedFormData.leads.map(lead => (
                          <tr key={lead.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(lead.created_time).toLocaleDateString()}
                            </td>
                            {lead.field_data.map(field => (
                              <td
                                key={field.name}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                              >
                                {field.values.join(", ")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                  No leads found for this form
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No lead forms found for this page</p>
        </div>
      )}
    </div>
  );
}
