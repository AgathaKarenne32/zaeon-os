import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { clientPromise } from "@/src/lib/db";
import { MongoClient } from "mongodb";

// A LISTA VIP
const ADMIN_EMAILS = [
    "zaeondao@gmail.com",
    "martinez@zaeon.space"
];

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            checks: ['none'],
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                // @ts-ignore
                token.role = user.role || "student";
            }
            if (trigger === "update" && session) return { ...token, ...session };
            return token;
        },
        async session({ session, token }) {
            if (session?.user && token.email) {
                const client = (await clientPromise) as MongoClient;
                const db = client.db();
                
                // MUDANÇA 1: Procura explicitamente na coleção 'users'
                const dbUser = await db.collection("users").findOne({ email: token.email });
                
                if (dbUser) {
                    session.user.name = dbUser.name || session.user.name;
                    session.user.image = dbUser.image || session.user.image;
                    // @ts-ignore
                    session.user.role = dbUser.role || "student";
                    // @ts-ignore
                    session.user.course = dbUser.course || "";
                    // @ts-ignore
                    session.user.academicLevel = dbUser.academicLevel || "Graduação";
                    
                    // MUDANÇA 2: Checagem segura de Admin baseada no token (não no banco)
                    // Isso garante que mesmo se o banco demorar, você loga como admin pelo email do Google!
                    const userEmail = token.email.toLowerCase();
                    // @ts-ignore
                    session.user.isAdmin = ADMIN_EMAILS.includes(userEmail);
                }
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};