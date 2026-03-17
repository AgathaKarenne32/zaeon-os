import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials"; // <-- NOVO: Importação do Provedor de Convidados
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { clientPromise } from "@/src/lib/db";
import { MongoClient } from "mongodb";

// 1. A LISTA VIP (Intacta!)
const ADMIN_EMAILS = [
    "zaeondao@gmail.com",
    "martinez@zaeon.space"
];

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        // A Porta Principal (Google)
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            checks: ['none'], //allowDangerousEmailAccountLinking: true, quando formos transicionar os usuários. 
        }),
        
        // --- NOVO: A Porta Lateral para Convidados (Shadow Accounts) ---
        CredentialsProvider({
            name: "Guest",
            credentials: {
                email: { label: "Email", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;

                const client = (await clientPromise) as MongoClient;
                const db = client.db();
                
                // Busca se o email do convidado já foi inserido no banco
                const user = await db.collection("users").findOne({ email: credentials.email.toLowerCase() });

                // Se existir, o NextAuth gera um Token JWT e deixa ele entrar!
                if (user) {
                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        image: user.image,
                        role: user.role
                    };
                }
                
                return null; // Se não existir, falha silenciosamente
            }
        })
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
                    const userEmail = token.email.toLowerCase();
                    // @ts-ignore
                    session.user.isAdmin = ADMIN_EMAILS.includes(userEmail); // Sua chave mestra continua intocável!
                }
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};