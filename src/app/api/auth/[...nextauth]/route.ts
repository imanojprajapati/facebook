import NextAuth from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import { JWT } from "next-auth/jwt";

interface ExtendedToken extends JWT {
  accessToken?: string;
}

const isDevelopment = process.env.NODE_ENV !== "production";
const callbackUrl = isDevelopment 
  ? "http://localhost:3000/api/auth/callback/facebook"
  : "https://www.leadstrack.in/api/auth/callback/facebook";

const handler = NextAuth({
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        url: "https://www.facebook.com/v18.0/dialog/oauth",
        params: {
          scope: "pages_show_list,pages_read_engagement",
        },
      },
      callbacks: {
        async redirect({ url, baseUrl }) {
          const finalUrl = url.startsWith('/') ? new URL(url, baseUrl).toString() : url;
          const allowedHosts = ['localhost:3000', 'www.leadstrack.in', 'leadstrack.in'];
          const urlObj = new URL(finalUrl);
          if (allowedHosts.includes(urlObj.host)) {
            return finalUrl;
          }
          return baseUrl;
        },
      },
    }),
  ],
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
  }
});

export { handler as GET, handler as POST };