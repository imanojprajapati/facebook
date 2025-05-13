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

    console.log('🔍 Starting leads fetch for page:', params.pageId);

    // Step 2: First get admin pages list
    try {
      const pagesResponse = await apiClient.fetchFromGraph<{ 
        data: Array<{ 
          id: string; 
          access_token: string;
          name: string;
          tasks: string[];
        }> 
      }>(
        'me/accounts',
        session.accessToken,
        { fields: 'name,id,access_token,tasks' }
      );

      const page = pagesResponse.data.find(p => p.id === params.pageId);
      
      if (!page) {
        console.error('❌ Page not found in user\'s accounts');
        return NextResponse.json({
          error: 'Page not found or no access',
          details: 'Make sure you are an admin of this page'
        }, { status: 403 });
      }      if (!page.tasks.includes('ACCESS_LEAD_GEN')) {
        console.error('❌ Page missing ACCESS_LEAD_GEN permission');
        return NextResponse.json({
          error: 'Insufficient page permissions',
          details: 'Please make sure you are a Page Admin or have the "Access Lead Gen" permission'
        }, { status: 403 });
      }

      // Step 3: Get lead forms for the page
      const formsResponse = await apiClient.fetchFromGraph<{ data: LeadgenForm[] }>(
        `${params.pageId}/leadgen_forms`,
        page.access_token,
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

      // Step 4: Get leads for each form
      const leads = await Promise.all(
        formsResponse.data.map(async (form) => {
          try {
            console.log(`🔍 Fetching leads for form ${form.id} (${form.name})`);
            
            const leadResponse = await apiClient.fetchFromGraph<{ data: Lead[] }>(
              `${form.id}/leads`,
              page.access_token,
              {
                fields: 'id,created_time,field_data,form_id',
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
              leads: leadResponse.data
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

      return NextResponse.json({
        page: {
          id: page.id,
          name: page.name
        },
        forms: formsResponse.data,
        leads
      });

    } catch (error: any) {
      console.error('❌ Error fetching leads:', error);
      errorReporter.reportFacebookError(error, {
        context: 'fetch_leads',
        pageId: params.pageId
      });

      const status = error.code === 190 ? 401 :  // Invalid token
                    error.code === 200 ? 403 :  // Permissions
                    error.code === 100 ? 404 :  // Not found
                    500;

      return NextResponse.json(
        { 
          error: "Failed to fetch leads",
          details: error.message || "Unknown error",
          code: error.code,
          subcode: error.subcode
        },
        { status }
      );
    }

  } catch (error: any) {
    console.error('❌ Fatal error in leads fetching process:', error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
