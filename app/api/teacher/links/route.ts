import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teacher = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'professor')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // @ts-ignore
        const links = await prisma.classLink.findMany({
            where: { teacherId: teacher.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(links);
    } catch (error) {
        console.error("Erro ao listar links:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
