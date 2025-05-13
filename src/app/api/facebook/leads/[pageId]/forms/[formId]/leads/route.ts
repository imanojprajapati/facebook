import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { apiClient } from "@/utils/api-client";
import { errorReporter } from "@/utils/error-reporting";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface Lead {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

export async function GET(
  request: Request,
  { params }: { params: { pageId: string; formId: string } }
) {
  try {
    // Step 1: Validate session
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      console.log('❌ No session or access token found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log(`🔍 Fetching leads for form ${params.formId} on page ${params.pageId}`);

    // Step 2: Get page access token from user's pages
    try {
      const pagesResponse = await apiClient.fetchFromGraph<{ 
        data: Array<{ 
          id: string; 
          access_token: string;
          name: string;
        }> 
      }>(
        'me/accounts',
        session.accessToken,
        { fields: 'name,id,access_token' }
      );

      const page = pagesResponse.data.find(p => p.id === params.pageId);
      if (!page) {
        console.error('❌ Page not found in user\'s accounts');
        return NextResponse.json({
          error: 'Page not found or no access',
          details: 'Make sure you are an admin of this page'
        }, { status: 403 });
      }      // Step 3: Get leads for the specific form
      const leadResponse = await apiClient.fetchFromGraph<{ data: Lead[] }>(
        `${params.formId}/leads`,
        page.access_token,
        {
          fields: 'id,created_time,field_data',
          limit: '100'
        }
      );

      if (!leadResponse?.data) {
        throw new Error('No leads data received');
      }

      console.log(`✅ Found ${leadResponse.data.length} leads for form ${params.formId}`);

      return NextResponse.json({
        leads: leadResponse.data
      });

    } catch (error: any) {
      console.error('❌ Error fetching leads:', error);
      return NextResponse.json({
        error: 'Failed to fetch leads',
        details: error.message
      }, { status: error.code === 190 ? 401 : 500 });
    }

  } catch (error: any) {
    console.error('❌ Error in leads fetching process:', error);
    errorReporter.reportFacebookError(error, {
      context: 'fetch_form_leads',
      pageId: params.pageId,
      formId: params.formId
    });

    return NextResponse.json(
      { 
        error: "Failed to fetch leads",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
