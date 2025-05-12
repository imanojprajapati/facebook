import NextAuth from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import { JWT } from "next-auth/jwt";
import { errorReporter } from "@/utils/error-reporting";
import { validateFacebookPermissions, REQUIRED_PERMISSIONS } from "@/utils/facebook-permissions";

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
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

import type { AuthOptions, DefaultSession, Account, Profile, User } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    userId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    id?: string;
  }
}

export const authOptions: AuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        url: "https://www.facebook.com/v18.0/dialog/oauth",
        params: {
          scope: REQUIRED_PERMISSIONS.join(","),
          auth_type: "rerequest"
        }
      },
      userinfo: {
        url: "https://graph.facebook.com/v18.0/me",
        params: { 
          fields: "id,name,email,picture.type(large)"
        }
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url || `https://graph.facebook.com/${profile.id}/picture?type=large`
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: User; account: Account | null; profile?: Profile }) {
      try {
        if (account?.provider === 'facebook' && account.access_token) {
          const hasPermissions = await validateFacebookPermissions(
            account.access_token,
            [...REQUIRED_PERMISSIONS]
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
          provider: "facebook"
        });
        return false;
      }
    },
    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: { session: DefaultSession; token: JWT }) {
      return {
        ...session,
        accessToken: token.accessToken,
        userId: token.sub
      };
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/auth/signin'
  },
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };