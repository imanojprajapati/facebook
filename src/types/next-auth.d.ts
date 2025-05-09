import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    userId?: string;
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      userLink?: string | null;
    };
  }

  interface Profile {
    id: string;
    name: string;
    email: string;
    picture?: {
      data: {
        url: string;
      };
    };
    link?: string;
  }
}