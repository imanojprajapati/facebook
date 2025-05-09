import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession();
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const accessToken = session.accessToken;
    
    // First, get basic user info
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${accessToken}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    const userData = await userResponse.json();
    
    if (userData.error) {
      throw new Error(userData.error.message);
    }

    // Then get pages with detailed information
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture,category,fan_count,link,verification_status,tasks&access_token=${accessToken}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    const pagesData = await pagesResponse.json();
    
    if (pagesData.error) {
      console.error('Facebook API Error:', pagesData.error);
      if (pagesData.error.code === 190) {
        return NextResponse.json({ error: "Invalid access token" }, { status: 401 });
      }
      throw new Error(pagesData.error.message);
    }
    
    return NextResponse.json({
      user: userData,
      pages: pagesData.data
    });
  } catch (error) {
    console.error('Error fetching Facebook data:', error);
    return NextResponse.json({ 
      error: "Failed to fetch Facebook data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}