import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- 1. GET: PUXAR OS POSTS DA SALA E SEUS COMENTÁRIOS ---
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const room = searchParams.get("room") || "lounge";

        const posts = await prisma.post.findMany({
            where: { room: room },
            orderBy: { createdAt: "desc" },
            include: {
                // Traz o autor do POST (para a foto dinâmica e lixeira do post)
                author: {
                    select: { email: true, image: true }
                },
                // 🔥 CORREÇÃO: Traz os comentários E os autores deles (para a lixeira do comentário!)
                comments: {
                    include: {
                        author: { select: { email: true } }
                    },
                    orderBy: { createdAt: "asc" } // Traz os comentários em ordem cronológica
                }
            }
        });

        // Formatando para o frontend não ter que lidar com estruturas aninhadas complexas do Prisma
        const formattedPosts = posts.map(post => ({
            id: post.id,
            user: post.user,
            userEmail: post.author?.email || "",
            userImage: post.author?.image || post.userImage,
            content: post.content,
            // Proteção contra registros antigos sem data
            createdAt: post.createdAt ? post.createdAt.toISOString() : new Date().toISOString(),
            likes: post.likes || [],
            room: post.room,
            // 🔥 CORREÇÃO: Mapeia os comentários para injetar o userEmail corretamente
            comments: post.comments.map(c => ({
                id: c.id,
                user: c.user,
                userEmail: c.author?.email || "",
                content: c.content,
                createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString()
            }))
        }));

        return NextResponse.json(formattedPosts);
    } catch (error) {
        console.error("Erro ao buscar posts:", error);
        return NextResponse.json({ error: "Falha na conexão com a Matrix" }, { status: 500 });
    }
}

// --- 2. POST: CRIAR UM NOVO SINAL (POSTAGEM RÁPIDA) ---
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { content, room } = await req.json();

        if (!content || !room) {
            return NextResponse.json({ error: "Conteúdo e Sala são obrigatórios" }, { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!dbUser) {
            return NextResponse.json({ error: "Usuário não encontrado no banco" }, { status: 404 });
        }

        const newPost = await prisma.post.create({
            data: {
                content,
                room,
                user: session.user.name || "Operative",
                userImage: session.user.image || "",
                userId: dbUser.id
            },
            include: {
                author: { select: { email: true, image: true } },
                // Mantém a simetria com a estrutura do GET
                comments: { include: { author: { select: { email: true } } } }
            }
        });

        // Formata igual ao GET para a tela atualizar na hora (Optimistic UI da raiz)
        const formattedPost = {
            id: newPost.id,
            user: newPost.user,
            userEmail: newPost.author?.email || "",
            userImage: newPost.author?.image || newPost.userImage,
            content: newPost.content,
            createdAt: newPost.createdAt ? newPost.createdAt.toISOString() : new Date().toISOString(),
            likes: newPost.likes || [],
            room: newPost.room,
            comments: [] // Um post recém-criado nunca terá comentários
        };

        return NextResponse.json(formattedPost);
    } catch (error) {
        console.error("Erro ao criar post:", error);
        return NextResponse.json({ error: "Falha ao transmitir sinal" }, { status: 500 });
    }
}

// --- 3. DELETE: DESINTEGRAR UM SINAL (LIXEIRA) ---
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const postId = searchParams.get("id");

        if (!postId) return NextResponse.json({ error: "ID do post não fornecido" }, { status: 400 });

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { author: true }
        });

        if (!post) return NextResponse.json({ error: "Sinal não encontrado" }, { status: 404 });

        // Regra de Segurança: Só o dono ou o Super Admin (Chave Mestra) podem apagar o Post INTEIRO
        // @ts-ignore
        const isSuperAdmin = session.user.isAdmin === true;
        const isOwner = post.author?.email === session.user.email;

        if (!isSuperAdmin && !isOwner) {
            return NextResponse.json({ error: "Privilégios insuficientes para desintegrar este sinal" }, { status: 403 });
        }

        await prisma.post.delete({
            where: { id: postId }
        });

        return NextResponse.json({ success: true, message: "Sinal desintegrado." });
    } catch (error) {
        console.error("Erro ao apagar post:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}