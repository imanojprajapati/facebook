import NextAuth from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import { JWT } from "next-auth/jwt";

interface ExtendedToken extends JWT {
  accessToken?: string;
}

const handler = NextAuth({
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "pages_show_list,pages_read_engagement,leads_retrieval,pages_manage_metadata,pages_read_user_content"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? ".leadstrack.in" : undefined
      }
    }
  },
  callbacks: {
    async jwt({ token, account }): Promise<ExtendedToken> {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: ExtendedToken }) {
      session.accessToken = token.accessToken;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  events: {
    async error(error) {
      console.error("NextAuth Error:", error);
    },
    async signIn({ user, account, profile }) {
      console.log("Successful sign in:", { 
        userId: user.id, 
        provider: account?.provider 
      });
    }
  },
  debug: process.env.NODE_ENV === 'development'
});

export { handler as GET, handler as POST };