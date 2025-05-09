import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession();
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { pageIds, pageTokens } = await request.json();

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
          const response = await fetch(
            `https://graph.facebook.com/v22.0/${pageId}/leads?access_token=${pageToken}&fields=id,created_time,ad_id,form_id,field_data`,
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            }
          );
          
          const data = await response.json();
          
          if (data.error) {
            console.error(`Error fetching leads for page ${pageId}:`, data.error);
            return {
              pageId,
              error: data.error.message,
              leads: []
            };
          }

          return {
            pageId,
            leads: data.data || []
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