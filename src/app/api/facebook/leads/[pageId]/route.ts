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
  try {
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.log('❌ No session or access token found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log('🔍 Starting leads fetch for page:', params.pageId);

    // Get page access token
    let pageData: PageData;
    try {
      pageData = await apiClient.fetchFromGraph<PageData>(
        params.pageId,
        session.accessToken,
        { fields: 'access_token,name,id' }
      );
    } catch (error: any) {
      console.error('❌ Failed to fetch page access token:', error);
      return NextResponse.json({
        error: 'Failed to get page access token',
        details: error.message
      }, { status: error.code === 190 ? 401 : 500 });
    }

    if (!pageData?.access_token) {
      console.error('❌ No page access token found');
      return NextResponse.json(
        { error: 'Could not get page access token. Make sure you have admin access to this page.' },
        { status: 403 }
      );
    }

    console.log('✅ Successfully got page access token');

    // Get lead forms with all necessary fields
    let formsResponse;
    try {
      formsResponse = await apiClient.fetchFromGraph<{ data: LeadgenForm[] }>(
        `${params.pageId}/leadgen_forms`,
        pageData.access_token,
        { 
          fields: 'id,name,status,leads_count,created_time',
          limit: '100'
        }
      );
    } catch (error: any) {
      console.error('❌ Failed to fetch lead forms:', error);
      return NextResponse.json({
        error: 'Failed to fetch lead forms',
        details: error.message
      }, { status: error.code === 200 ? 403 : 500 });
    }

    if (!formsResponse?.data) {
      console.error('❌ No forms data received from Facebook');
      return NextResponse.json(
        { error: 'Failed to fetch lead forms data' },
        { status: 500 }
      );
    }

    console.log('📋 Found lead forms:', {
      count: formsResponse.data.length,
      forms: formsResponse.data.map(f => ({
        id: f.id,
        name: f.name,
        leadCount: f.leads_count
      }))
    });

    // Get leads for each form using the direct form ID endpoint
    const leads = await Promise.all(
      formsResponse.data.map(async (form) => {
        try {
          console.log(`🔍 Fetching leads for form ${form.id} (${form.name})`);
          
          // Use the direct form ID endpoint to fetch leads
          const leadResponse = await apiClient.fetchFromGraph<{ data: Lead[] }>(
            `${form.id}/leads`,
            pageData.access_token,
            {
              fields: 'id,created_time,field_data',
              limit: '100'
            }
          );

          if (!leadResponse?.data) {
            throw new Error(`No leads data received for form ${form.id}`);
          }

          console.log(`✅ Found ${leadResponse.data.length} leads for form ${form.name}`);

          return {
            form_id: form.id,
            form_name: form.name,
            leads: leadResponse.data.map(lead => ({
              id: lead.id,
              created_time: lead.created_time,
              field_data: lead.field_data
            }))
          };
        } catch (error: any) {
          console.error(`❌ Error fetching leads for form ${form.id}:`, error);
          return {
            form_id: form.id,
            form_name: form.name,
            error: error.message || 'Unknown error',
            errorCode: error.code,
            leads: []
          };
        }
      })
    );

    const stats = {
      formCount: formsResponse.data.length,
      totalLeads: leads.reduce((sum, form) => sum + form.leads.length, 0),
      formsWithLeads: leads.filter(form => form.leads.length > 0).length,
      formsWithErrors: leads.filter(form => 'error' in form).length
    };

    console.log('📊 Final response stats:', stats);

    return NextResponse.json({
      forms: formsResponse.data,
      leads,
      stats
    });

  } catch (error: any) {
    console.error('❌ Error in leads fetching process:', error);
    errorReporter.reportFacebookError(error, {
      context: 'fetch_leads',
      pageId: params.pageId
    });

    return NextResponse.json(
      { 
        error: "Failed to fetch leads",
        details: error.message || "Unknown error",
        code: error.code
      },
      { status: error.code === 190 ? 401 : 500 }
    );
  }
}
