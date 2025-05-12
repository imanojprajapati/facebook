import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { apiClient } from "@/utils/api-client";
import type { FacebookData, FacebookUser, FacebookPage, FacebookApiResponse } from "@/types/facebook";
import { errorReporter } from "@/utils/error-reporting";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface FacebookAPIError {
  code: number;
  message: string;
  type?: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken) {
    console.error("Session missing or invalid:", { 
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : null
    });
    return NextResponse.json({ 
      error: "Not authenticated",
      details: "Please sign in again to refresh your session"
    }, { status: 401 });
  }

  try {    console.log('🔄 Fetching Facebook data...');
    
    const [userData, pagesData] = await Promise.all([
      apiClient.fetchFromGraph<FacebookUser>(
        'me',
        session.accessToken,
        {
          fields: 'id,name,email,picture'
        }
      ),
      apiClient.fetchFromGraph<FacebookApiResponse<FacebookPage[]>>(
        'me/accounts',
        session.accessToken,
        {
          fields: 'id,name,access_token,picture,category,fan_count,link,verification_status,tasks'
        }
      )
    ]);

    console.log('👤 User Data:', {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      hasProfilePicture: !!userData.picture
    });

    console.log('📑 Pages Data:', {
      totalPages: pagesData.data.length,
      pages: pagesData.data.map(page => ({
        id: page.id,
        name: page.name,
        category: page.category,
        fanCount: page.fan_count,
        verified: page.verification_status === 'verified'
      }))
    });

    return NextResponse.json({
      user: userData,
      pages: pagesData.data
    } satisfies FacebookData);

  } catch (error: unknown) {
    errorReporter.reportFacebookError(error, {
      context: 'fetch_pages',
      sessionId: session.accessToken.slice(-8)
    });

    const fbError = error as FacebookAPIError;
    
    if (fbError?.code === 190) {
      return NextResponse.json({ 
        error: "Session expired. Please sign in again." 
      }, { 
        status: 401 
      });
    }
    
    if (fbError?.code === 200 || fbError?.type === 'OAuthException') {
      return NextResponse.json({ 
        error: "Insufficient permissions. Please grant all required permissions." 
      }, { 
        status: 403 
      });
    }

    return NextResponse.json({ 
      error: "Failed to fetch Facebook data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { 
      status: 500 
    });
  }
}