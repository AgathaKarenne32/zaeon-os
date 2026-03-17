import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- 1. GET: PUXAR OS POSTS DA SALA ---
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const room = searchParams.get("room") || "lounge";

        // Se for lounge, vamos puxar apenas os posts globais. 
        // Se for 'med', puxa só os de medicina, etc.
        const posts = await prisma.post.findMany({
            where: { room: room },
            orderBy: { createdAt: "desc" },
            include: {
                author: {
                    select: { email: true, image: true } // Precisamos do email para a lixeira no frontend
                },
                comments: true
            }
        });

        // Formatando para o frontend entender perfeitamente
        const formattedPosts = posts.map(post => ({
            id: post.id,
            user: post.user,
            userEmail: post.author?.email || "", // O Frontend usa isso para mostrar a Lixeira
            userImage: post.author?.image || post.userImage,
            content: post.content,
            createdAt: post.createdAt.toISOString(),
            likes: post.likes,
            room: post.room,
            comments: post.comments
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

        // Acha o ID real do usuário no banco para fazer a relação
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
                userId: dbUser.id // Cria o elo com a tabela User
            },
            include: {
                author: { select: { email: true, image: true } },
                comments: true
            }
        });

        // Formata igual ao GET para a tela atualizar na hora
        const formattedPost = {
            id: newPost.id,
            user: newPost.user,
            userEmail: newPost.author?.email || "",
            userImage: newPost.author?.image || newPost.userImage,
            content: newPost.content,
            createdAt: newPost.createdAt.toISOString(),
            likes: newPost.likes,
            room: newPost.room,
            comments: newPost.comments
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

        // Acha o post para conferir quem é o dono
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { author: true }
        });

        if (!post) return NextResponse.json({ error: "Sinal não encontrado" }, { status: 404 });

        // Regra de Segurança: Só o dono ou o Super Admin (Chave Mestra) podem apagar
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