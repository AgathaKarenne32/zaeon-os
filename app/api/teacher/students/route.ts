import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Lista todos os alunos vinculados ao professor logado
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teacher = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'professor')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const relations = await prisma.teacherStudent.findMany({
            where: { teacherId: teacher.id },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        course: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        const students = relations.map(r => ({
            id: r.student.id,
            name: r.student.name,
            image: r.student.image,
            course: r.student.course,
            addedAt: r.createdAt,
            relationId: r.id,
        }));

        return NextResponse.json(students);
    } catch (error) {
        console.error("Erro ao listar alunos do professor:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Adiciona um aluno ao professor (sem precisar de permissão do aluno)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teacher = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'professor')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { studentId } = await req.json();
        if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });

        // Verifica se o aluno existe
        const student = await prisma.user.findUnique({ where: { id: studentId } });
        if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

        // Cria a relação (upsert para evitar duplicatas)
        const relation = await prisma.teacherStudent.upsert({
            where: {
                teacherId_studentId: {
                    teacherId: teacher.id,
                    studentId: studentId,
                }
            },
            update: {},
            create: {
                teacherId: teacher.id,
                studentId: studentId,
            },
        });

        return NextResponse.json({ success: true, relation });
    } catch (error) {
        console.error("Erro ao adicionar aluno:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Remove um aluno da lista do professor
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const teacher = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'professor')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');
        if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });

        await prisma.teacherStudent.deleteMany({
            where: {
                teacherId: teacher.id,
                studentId: studentId,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro ao remover aluno:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
