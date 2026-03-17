import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials"; 
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
        
        CredentialsProvider({
            name: "Guest",
            credentials: {
                email: { label: "Email", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;

                const client = (await clientPromise) as MongoClient;
                const db = client.db();
                
                const user = await db.collection("users").findOne({ email: credentials.email.toLowerCase() });

                if (user) {
                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        // 🔥 A CORREÇÃO ESTÁ AQUI: NÃO retornamos a imagem para o NextAuth!
                        // Deixamos a imagem no banco. O cookie ficará ultra-leve.
                        role: user.role
                    };
                }
                
                return null;
            }
        })
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                // @ts-ignore
                token.role = user.role || "student";
            }
            
            // 🔥 BLINDAGEM MÁXIMA: Garante que NENHUMA imagem entre no token,
            // nem do Google, nem de lugar nenhum. 
            // O cookie nunca passará de 1KB.
            delete token.picture;
            delete token.image;
            
            return token;
        },
        async session({ session, token }) {
            if (session?.user && token.email) {
                const client = (await clientPromise) as MongoClient;
                const db = client.db();
                
                const dbUser = await db.collection("users").findOne({ email: token.email });
                
                if (dbUser) {
                    session.user.name = dbUser.name || session.user.name;
                    // 🔥 Aqui nós pegamos a foto gigante DIRETO DO BANCO para mostrar na tela, 
                    // sem precisar trafegar ela no Cookie!
                    session.user.image = dbUser.image || null;
                    // @ts-ignore
                    session.user.role = dbUser.role || "student";
                    // @ts-ignore
                    session.user.course = dbUser.course || "";
                    // @ts-ignore
                    session.user.academicLevel = dbUser.academicLevel || "Graduação";
                    
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