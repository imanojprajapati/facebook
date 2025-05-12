import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { apiClient } from "@/utils/api-client";
import type { FacebookLead, LeadsRequest, FacebookApiResponse } from "@/types/facebook";
import { errorReporter } from "@/utils/error-reporting";

export async function POST(request: Request) {
  const session = await getServerSession();
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { pageIds, pageTokens } = await request.json() as LeadsRequest;

    if (!pageIds || !Array.isArray(pageIds) || !pageTokens || !Array.isArray(pageTokens)) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    if (pageIds.length !== pageTokens.length) {
      return NextResponse.json({ error: "Mismatched page IDs and tokens" }, { status: 400 });
    }

    const allLeads = await Promise.all(
      pageIds.map(async (pageId, index) => {
        const pageToken = pageTokens[index];
        try {
          const leadsData = await apiClient.fetchFromGraph<{ data: FacebookLead[] }>(
            `${pageId}/leads`,
            pageToken,
            {
              fields: 'id,created_time,ad_id,form_id,field_data'
            }
          );

          return {
            pageId,
            leads: leadsData.data ?? []
          };
        } catch (error) {
          errorReporter.reportFacebookError(error, {
            context: 'fetch_leads',
            pageId
          });
          
          return {
            pageId,
            error: error instanceof Error ? error.message : "Unknown error",
            leads: []
          };
        }
      })
    );

    // Filter out pages with no leads
    const validLeads = allLeads.filter(page => page.leads.length > 0 || page.error);

    return NextResponse.json({ 
      data: validLeads,
      total: validLeads.reduce((sum, page) => sum + page.leads.length, 0)
    });
  } catch (error) {
    errorReporter.report(error instanceof Error ? error : new Error(String(error)), {
      type: 'leads_request_error'
    });
    
    return NextResponse.json({ 
      error: "Failed to fetch leads",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { 
      status: 500 
    });
  }
}