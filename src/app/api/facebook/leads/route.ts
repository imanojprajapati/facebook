import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { apiClient } from "@/utils/api-client";
import type { FacebookLead, LeadsRequest } from "@/types/facebook";

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
          const leadsData = await apiClient.get<{ data: FacebookLead[] }>(
            `https://graph.facebook.com/v18.0/${pageId}/leads?access_token=${pageToken}&fields=id,created_time,ad_id,form_id,field_data`
          );

          return {
            pageId,
            leads: leadsData.data
          };
        } catch (error) {
          console.error(`Error fetching leads for page ${pageId}:`, error);
          return {
            pageId,
            error: error instanceof Error ? error.message : "Unknown error",
            leads: []
          };
        }
      })
    );

    return NextResponse.json({ data: allLeads });
  } catch (error) {
    console.error('Error processing leads request:', error);
    return NextResponse.json({ 
      error: "Failed to fetch leads",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}