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
        url: "https://www.facebook.com/v18.0/dialog/oauth",
        params: {
          scope: "email,pages_show_list,pages_read_engagement,pages_manage_metadata,public_profile,leads_retrieval,user_link"
        }
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
          userLink: profile.link
        };
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, account, profile }): Promise<ExtendedToken> {
      if (account) {
        token.accessToken = account.access_token;
        token.id = profile?.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: ExtendedToken }) {
      session.accessToken = token.accessToken;
      session.userId = token.id;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect URLs more permissively
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith("http://localhost:") || 
          url.startsWith("https://www.leadstrack.in") ||
          url.startsWith("https://leadstrack.in")) {
        return url;
      }
      return baseUrl;
    }
  }
});

export { handler as GET, handler as POST };