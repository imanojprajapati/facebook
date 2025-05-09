import NextAuth from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import { JWT } from "next-auth/jwt";

interface ExtendedToken extends JWT {
  accessToken?: string;
}

const handler = NextAuth({
  debug: true, // Enable debug messages
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        url: "https://www.facebook.com/v22.0/dialog/oauth",
        params: {
          scope: "email,pages_show_list,pages_read_engagement,pages_manage_metadata,public_profile"
        }
      },
      profile(profile) {
        console.log("Facebook profile:", profile); // Debug log
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
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
    async signIn({ user, account, profile, email, credentials }) {
      console.log("Sign in callback:", { user, account, profile }); // Debug log
      return true;
    },
    async jwt({ token, account, profile }): Promise<ExtendedToken> {
      console.log("JWT callback:", { token, account, profile }); // Debug log
      if (account) {
        token.accessToken = account.access_token;
        token.id = profile?.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: ExtendedToken }) {
      console.log("Session callback:", { session, token }); // Debug log
      session.accessToken = token.accessToken;
      session.userId = token.id;
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback:", { url, baseUrl }); // Debug log
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    }
  }
});

export { handler as GET, handler as POST };