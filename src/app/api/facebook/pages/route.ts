import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession();
  
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const accessToken = session.accessToken;
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture,category&access_token=${accessToken}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    );

    const data = await response.json();
    
    if (data.error) {
      console.error('Facebook API Error:', data.error);
      if (data.error.code === 190) {
        return NextResponse.json({ error: "Invalid access token" }, { status: 401 });
      }
      throw new Error(data.error.message);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ 
      error: "Failed to fetch pages",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}