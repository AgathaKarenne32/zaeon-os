import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import type { BioSimAnnotation, BioSimSessionRecord } from '../sessions/route';

export const dynamic = 'force-dynamic';

async function getUserAndSessions(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { user: null, space: null, sessions: [] as BioSimSessionRecord[] };
  const space = await prisma.userSpaceData.findUnique({ where: { userId: user.id } });

  const modules = space?.personalModules;
  const sessions: BioSimSessionRecord[] =
    modules && typeof modules === 'object' && !Array.isArray(modules)
      ? ((modules as any)?.biosim?.sessions ?? [])
      : [];

  return { user, space, sessions };
}

function buildModules(space: any, sessions: BioSimSessionRecord[]): any {
  const existing = (space?.personalModules && typeof space.personalModules === 'object')
    ? (space.personalModules as Record<string, unknown>)
    : {};
  return { ...existing, biosim: { sessions } };
}

// ─── POST — add annotation to a session ──────────────────────────────────────
export async function POST(req: Request) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      sessionId: string;
      text: string;
      color?: string;
      sceneTitle?: string;
    };

    if (!body.sessionId || !body.text?.trim()) {
      return NextResponse.json({ error: 'sessionId and text are required' }, { status: 400 });
    }

    const { user, space, sessions } = await getUserAndSessions(authSession.user.email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const idx = sessions.findIndex(s => s.id === body.sessionId);
    if (idx === -1) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const annotation: BioSimAnnotation = {
      id:         crypto.randomUUID(),
      text:       body.text.trim(),
      color:      body.color      ?? '#fbbf24',
      sceneTitle: body.sceneTitle ?? 'Unknown scene',
      createdAt:  new Date().toISOString(),
    };

    sessions[idx] = {
      ...sessions[idx],
      annotations: [...(sessions[idx].annotations ?? []), annotation],
      updatedAt:   new Date().toISOString(),
    };

    await prisma.userSpaceData.upsert({
      where:  { userId: user.id },
      update: { personalModules: buildModules(space, sessions) },
      create: { userId: user.id, personalModules: buildModules(null, sessions) },
    });

    return NextResponse.json({ success: true, annotation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE — remove annotation from a session ───────────────────────────────
export async function DELETE(req: Request) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId    = searchParams.get('sessionId');
    const annotationId = searchParams.get('annotationId');

    if (!sessionId || !annotationId) {
      return NextResponse.json({ error: 'Missing sessionId or annotationId' }, { status: 400 });
    }

    const { user, space, sessions } = await getUserAndSessions(authSession.user.email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    sessions[idx] = {
      ...sessions[idx],
      annotations: sessions[idx].annotations.filter(a => a.id !== annotationId),
      updatedAt:   new Date().toISOString(),
    };

    await prisma.userSpaceData.upsert({
      where:  { userId: user.id },
      update: { personalModules: buildModules(space, sessions) },
      create: { userId: user.id, personalModules: buildModules(null, sessions) },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
