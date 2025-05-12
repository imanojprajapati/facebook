import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { apiClient } from "@/utils/api-client";
import { errorReporter } from "@/utils/error-reporting";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { validateFacebookPermissions, REQUIRED_PERMISSIONS } from "@/utils/facebook-permissions";

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
  id: string;
  name: string;
  access_token: string;
}

export async function GET(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    // Step 1: Validate session
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.log('❌ No session or access token found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Step 1.5: Validate Facebook permissions
    try {
      const hasPermissions = await validateFacebookPermissions(session.accessToken);
      if (!hasPermissions) {
        console.log('❌ Missing required Facebook permissions');
        return NextResponse.json({ 
          error: "Insufficient permissions",
          details: "Missing required Facebook permissions. Please ensure you have granted all necessary permissions.",
          required: REQUIRED_PERMISSIONS
        }, { status: 403 });
      }
    } catch (error: any) {
      console.error('❌ Error validating permissions:', error);
      return NextResponse.json({
        error: "Permission validation failed",
        details: error.message
      }, { status: 403 });
    }

    console.log('🔍 Starting leads fetch for page:', params.pageId);

    // Step 2: Get pages the user manages to find the correct page access token
    let pageData: PageData;
    try {
      const pagesResponse = await apiClient.fetchFromGraph<{ 
        data: Array<PageData>
      }>(
        'me/accounts',
        session.accessToken,
        { fields: 'name,id,access_token' }
      );

      // Find the specific page we want
      const page = pagesResponse.data.find(p => p.id === params.pageId);
      if (!page) {
        console.error('❌ Page not found in user\'s accounts');
        return NextResponse.json({
          error: 'Page not found or no access',
          details: 'The specified page was not found in your account list'
        }, { status: 404 });
      }

      pageData = page;
      console.log('✅ Found page:', page.name);

    } catch (error: any) {
      console.error('❌ Failed to fetch pages:', error);
      return NextResponse.json({
        error: 'Failed to get pages',
        details: error.message
      }, { status: error.code === 190 ? 401 : 500 });
    }

    // Step 3: Get lead forms for the page
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

      if (!formsResponse?.data) {
        throw new Error('No forms data received');
      }

      console.log('📋 Found lead forms:', {
        count: formsResponse.data.length,
        forms: formsResponse.data.map(f => ({
          id: f.id,
          name: f.name,
          leadCount: f.leads_count
        }))
      });

    } catch (error: any) {
      console.error('❌ Failed to fetch lead forms:', error);
      return NextResponse.json({
        error: 'Failed to fetch lead forms',
        details: error.message
      }, { status: error.code === 200 ? 403 : 500 });
    }

    // Step 4: Get leads for each form
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
      page: {
        id: pageData.id,
        name: pageData.name
      },
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
