import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { apiClient } from "@/utils/api-client";
import { errorReporter } from "@/utils/error-reporting";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface LeadgenForm {
  id: string;
  name: string;
  status: string;
  created_time: string;
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

    console.log('🔍 Fetching forms for page:', params.pageId);

    // Step 2: Get page access token from user's pages
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
      }

      // Make sure we have basic permissions for lead access
      if (!page.tasks?.includes('ACCESS_LEAD_GEN')) {
        console.error('❌ Missing required page permissions');
        return NextResponse.json({
          error: 'Missing Facebook Page Permission',
          details: 'To access leads, you need the "Access Lead Gen" permission on this Facebook Page.\n\nSteps to fix:\n1. Go to Facebook Page Settings\n2. Click Tasks/Roles\n3. Find your account\n4. Click Edit\n5. Enable "Access Lead Gen"\n\nIf you don\'t see this option, ask a Page Admin to grant you the permission.',
          helpUrl: 'https://www.facebook.com/business/help/1869651226666390'
        }, { status: 403 });
      }

      // Step 3: Get lead forms for the page
      const formsResponse = await apiClient.fetchFromGraph<{ data: LeadgenForm[] }>(
        `${params.pageId}/leadgen_forms`,
        page.access_token,
        { 
          fields: 'id,name,status,created_time',
          limit: '100'
        }
      );

      if (!formsResponse?.data) {
        throw new Error('No forms data received');
      }

      console.log('📋 Found lead forms:', {
        count: formsResponse.data.length,
        forms: formsResponse.data.map(f => ({          id: f.id,
          name: f.name
        }))
      });

      return NextResponse.json({
        forms: formsResponse.data
      });

    } catch (error: any) {
      console.error('❌ Error fetching forms:', error);
      return NextResponse.json({
        error: 'Failed to fetch forms',
        details: error.message
      }, { status: error.code === 190 ? 401 : 500 });
    }

  } catch (error: any) {
    console.error('❌ Error in forms fetching process:', error);
    errorReporter.reportFacebookError(error, {
      context: 'fetch_forms',
      pageId: params.pageId
    });

    return NextResponse.json(
      { 
        error: "Failed to fetch forms",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
