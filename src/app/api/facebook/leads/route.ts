import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession();
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { pageIds, pageTokens } = await request.json();

    if (!pageIds || !Array.isArray(pageIds)) {
      return NextResponse.json({ error: "Invalid page IDs" }, { status: 400 });
    }

    const allLeads = await Promise.all(
      pageIds.map(async (pageId, index) => {
        const pageToken = pageTokens[index];
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}/leads?access_token=${pageToken}&fields=id,created_time,ad_id,form_id,field_data`
        );
        const data = await response.json();
        return {
          pageId,
          leads: data.data || []
        };
      })
    );

    return NextResponse.json({ data: allLeads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}