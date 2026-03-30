import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Busca estudantes na base de dados por nome (query param: ?q=nome)
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teacher = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'professor')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';

        if (query.length < 2) {
            return NextResponse.json([]);
        }

        // Busca alunos (role = student ou sem role) que correspondem ao nome
        const students = await prisma.user.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' },
                id: { not: teacher.id }, // Não retorna o próprio professor
                role: { not: 'teacher' },
            },
            select: {
                id: true,
                name: true,
                image: true,
                course: true,
            },
            take: 10,
        });

        // Verifica quais já são alunos deste professor
        const existingRelations = await prisma.teacherStudent.findMany({
            where: {
                teacherId: teacher.id,
                studentId: { in: students.map(s => s.id) },
            },
            select: { studentId: true },
        });

        const existingIds = new Set(existingRelations.map(r => r.studentId));

        const results = students.map(s => ({
            ...s,
            isAdded: existingIds.has(s.id),
        }));

        return NextResponse.json(results);
    } catch (error) {
        console.error("Erro na busca de estudantes:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
