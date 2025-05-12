import NextAuth from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import { JWT } from "next-auth/jwt";
import { errorReporter } from "@/utils/error-reporting";
import { validateFacebookPermissions } from "@/utils/facebook-permissions";

interface ExtendedToken extends JWT {
  accessToken?: string;
  id?: string;
}

// Verify required environment variables
const requiredEnvVars = {
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL,
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
  }
});

const handler = NextAuth({
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth error:', { code, metadata });
      errorReporter.report(new Error(`NextAuth error: ${code}`), {
        code,
        metadata,
        type: 'auth_error'
      });
    },
    warn(code) {
      console.warn('NextAuth warning:', code);
    },
  },
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        url: "https://www.facebook.com/v18.0/dialog/oauth",
        params: {
          scope: [
            "email",
            "pages_show_list",
            "pages_read_engagement",
            "pages_manage_metadata",
            "leads_retrieval",
            "pages_manage_ads",
            "public_profile"
          ].join(",")
        }
      },
      userinfo: {
        url: "https://graph.facebook.com/v18.0/me",
        params: { 
          fields: "id,name,email,picture.type(large)"
        },
        async request({ tokens, client, provider }) {
          try {
            return await client.userinfo(tokens.access_token!);
          } catch (error) {
            errorReporter.reportFacebookError(error, {
              type: 'userinfo_error',
              provider: 'facebook'
            });
            throw error;
          }
        }
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: `https://graph.facebook.com/${profile.id}/picture?type=large`
        };
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    signOut: "/auth/signin"
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        console.log("Sign in attempt:", {
          user: { id: user.id, name: user.name, email: user.email },
          account: { provider: account?.provider, type: account?.type },
          profile: profile ? { id: profile.id, email: profile.email } : null
        });
        
        if (account?.provider === 'facebook') {
          if (!account?.access_token) {
            console.error("No access token received from Facebook");
            throw new Error("No access token received");
          }

          // Validate required permissions
          const requiredPermissions = [
            "email",
            "pages_show_list",
            "pages_read_engagement",
            "pages_manage_metadata",
            "leads_retrieval"
          ];

          const hasPermissions = await validateFacebookPermissions(
            account.access_token,
            requiredPermissions
          );

          if (!hasPermissions) {
            console.error('Missing required Facebook permissions');
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        errorReporter.report(error instanceof Error ? error : new Error("Sign in failed"), {
          userId: user.id,
          provider: "facebook",
          type: "signin_error"
        });
        return false;
      }
    },
    async jwt({ token, account, profile }): Promise<ExtendedToken> {
      try {
        if (account) {
          console.log("Setting access token in JWT:", { 
            tokenId: token.sub,
            profileId: profile?.id,
            hasAccessToken: !!account.access_token
          });
          
          token.accessToken = account.access_token;
          token.id = profile?.id;
        }
        return token;
      } catch (error) {
        console.error("JWT error:", error);
        errorReporter.report(error instanceof Error ? error : new Error("JWT processing failed"), {
          tokenId: token.sub,
          type: "jwt_error"
        });
        throw error;
      }
    },
    async session({ session, token }: { session: any; token: ExtendedToken }) {
      try {
        console.log("Creating session:", { 
          userId: token.id,
          hasAccessToken: !!token.accessToken
        });
        
        if (!token.accessToken) {
          throw new Error("No access token available in session");
        }
        
        session.accessToken = token.accessToken;
        session.userId = token.id;
        return session;
      } catch (error) {
        console.error("Session error:", error);
        errorReporter.report(error instanceof Error ? error : new Error("Session creation failed"), {
          userId: token.id,
          type: "session_error"
        });
        throw error;
      }
    },
    async redirect({ url, baseUrl }) {
      // Use custom callback URL if provided
      const callbackUrl = process.env.FACEBOOK_CALLBACK_URL;
      if (callbackUrl) {
        const callbackBaseUrl = new URL(callbackUrl).origin;
        if (url.startsWith("/")) return `${callbackBaseUrl}${url}`;
        if (url.startsWith(callbackBaseUrl)) return url;
        return callbackBaseUrl;
      }

      // Fallback to default behavior
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    }
  }
});

export { handler as GET, handler as POST };