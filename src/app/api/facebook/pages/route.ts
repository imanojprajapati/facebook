import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { apiClient } from "@/utils/api-client";
import type { FacebookData, FacebookUser, FacebookPage } from "@/types/facebook";

export async function GET() {
  const session = await getServerSession();
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const userData = await apiClient.get<FacebookUser>(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${session.accessToken}`
    );

    const pagesData = await apiClient.get<{ data: FacebookPage[] }>(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture,category,fan_count,link,verification_status,tasks&access_token=${session.accessToken}`
    );
    
    return NextResponse.json({
      user: userData,
      pages: pagesData.data
    } satisfies FacebookData);

  } catch (error) {
    console.error('Error fetching Facebook data:', error);
    if (error?.code === 190) {
      return NextResponse.json({ error: "Invalid access token" }, { status: 401 });
    }
    return NextResponse.json({ 
      error: "Failed to fetch Facebook data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}