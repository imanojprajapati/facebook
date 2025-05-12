import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { apiClient } from "@/utils/api-client";
import { errorReporter } from "@/utils/error-reporting";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface LeadgenForm {
  id: string;
  name: string;
  status: string;
  leads_count: number;
  created_time: string;
}

interface Lead {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
  form_id: string;
}

interface PageData {
  access_token: string;
}

export async function GET(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken) {
    console.log('❌ No session or access token found');
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    console.log('🔄 Fetching leads for page:', params.pageId);

    // First, get the page access token
    const pageData = await apiClient.fetchFromGraph<PageData>(
      `${params.pageId}`,
      session.accessToken,
      { fields: 'access_token' }
    );

    if (!pageData.access_token) {
      console.log('❌ No page access token found');
      throw new Error('Could not get page access token');
    }

    console.log('✅ Got page access token');

    // Get all lead forms for the page
    const formsResponse = await apiClient.fetchFromGraph<{ data: LeadgenForm[] }>(
      `${params.pageId}/leadgen_forms`,
      pageData.access_token,      { 
        fields: 'id,name,status,leads_count,created_time',
        limit: '100'
      }
    );

    console.log('📋 Found lead forms:', {
      count: formsResponse.data.length,
      forms: formsResponse.data.map(f => ({
        id: f.id,
        name: f.name,
        leadCount: f.leads_count
      }))
    });

    // Get leads for each form
    const leads = await Promise.all(
      formsResponse.data.map(async (form) => {
        try {
          console.log(`🔍 Fetching leads for form: ${form.name} (${form.id})`);
          
          const leadResponse = await apiClient.fetchFromGraph<{ data: Lead[] }>(
            `${form.id}/leads`,
            pageData.access_token,
            {              fields: 'id,created_time,field_data',
              limit: '100'
            }
          );

          console.log(`✅ Found ${leadResponse.data.length} leads for form: ${form.name}`);

          return {
            form_id: form.id,
            form_name: form.name,
            leads: leadResponse.data
          };
        } catch (error) {
          console.error(`❌ Error fetching leads for form ${form.id}:`, error);
          return {
            form_id: form.id,
            form_name: form.name,
            error: error instanceof Error ? error.message : 'Unknown error',
            leads: []
          };
        }
      })
    );

    console.log('📊 Final response data:', {
      formCount: formsResponse.data.length,
      totalLeads: leads.reduce((sum, form) => sum + form.leads.length, 0),
      formsWithLeads: leads.filter(form => form.leads.length > 0).length
    });

    return NextResponse.json({
      forms: formsResponse.data,
      leads: leads
    });

  } catch (error) {
    console.error('❌ Error fetching leads:', error);
    errorReporter.reportFacebookError(error, {
      context: 'fetch_leads',
      pageId: params.pageId
    });

    return NextResponse.json(
      { 
        error: "Failed to fetch leads",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
