import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getUserAndSpace(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { user: null, space: null };

  const space = await prisma.userSpaceData.findUnique({ where: { userId: user.id } });
  return { user, space };
}

/** Extract biosim sessions array from UserSpaceData.personalModules */
function getSessions(space: any): BioSimSessionRecord[] {
  const modules = space?.personalModules;
  if (modules && typeof modules === 'object' && !Array.isArray(modules)) {
    const raw = (modules as any).biosim?.sessions;
    if (Array.isArray(raw)) return raw;
  }
  return [];
}

/** Merge updated sessions back into personalModules */
function buildModules(space: any, sessions: BioSimSessionRecord[]): any {
  const existing = (space?.personalModules && typeof space.personalModules === 'object')
    ? (space.personalModules as Record<string, unknown>)
    : {};
  return {
    ...existing,
    biosim: { sessions },
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BioSimAnnotation {
  id:         string;
  text:       string;
  color:      string;
  sceneTitle: string;   // which scene was active when note was added
  createdAt:  string;
}

export interface BioSimSessionRecord {
  id:            string;
  title:         string;
  prompt?:       string;
  courseRoom:    string;
  sceneDescriptor: unknown;  // Full SceneDescriptor — opaque to API
  renderHistory: unknown[];  // Last N SceneDescriptors (capped at 20)
  voxelCount:    number;
  annotations:   BioSimAnnotation[];
  createdAt:     string;
  updatedAt:     string;
}

// ─── GET — list all sessions for the current user ─────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { space } = await getUserAndSpace(session.user.email);
    const sessions  = getSessions(space);

    // Sort newest first
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({ sessions: sorted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST — create or update a session ────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body: Partial<BioSimSessionRecord> & { action?: string; sessionId?: string } = await req.json();

    const { user, space } = await getUserAndSpace(session.user.email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const sessions = getSessions(space);

    // ── Upsert logic ──────────────────────────────────────────────────────────
    const now       = new Date().toISOString();
    const sessionId = body.id ?? body.sessionId ?? crypto.randomUUID();

    const existing = sessions.findIndex(s => s.id === sessionId);

    // Cap render history at 20 entries
    const renderHistory = Array.isArray(body.renderHistory)
      ? body.renderHistory.slice(-20)
      : [];

    const record: BioSimSessionRecord = {
      id:              sessionId,
      title:           body.title          ?? 'Untitled Session',
      prompt:          body.prompt,
      courseRoom:      body.courseRoom     ?? 'bio',
      sceneDescriptor: body.sceneDescriptor ?? {},
      renderHistory,
      voxelCount:      body.voxelCount     ?? 0,
      annotations:     body.annotations    ?? (existing >= 0 ? sessions[existing].annotations : []),
      createdAt:       existing >= 0 ? sessions[existing].createdAt : now,
      updatedAt:       now,
    };

    if (existing >= 0) {
      sessions[existing] = record;
    } else {
      sessions.push(record);
    }

    // Keep max 50 sessions per user
    const trimmed = sessions
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 50);

    await prisma.userSpaceData.upsert({
      where:  { userId: user.id },
      update: { personalModules: buildModules(space, trimmed) },
      create: { userId: user.id, personalModules: buildModules(null, trimmed) },
    });

    return NextResponse.json({ success: true, session: record });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE — remove a session ────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('id');
    if (!sessionId) return NextResponse.json({ error: 'Missing session id' }, { status: 400 });

    const { user, space } = await getUserAndSpace(session.user.email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const sessions = getSessions(space).filter(s => s.id !== sessionId);

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
