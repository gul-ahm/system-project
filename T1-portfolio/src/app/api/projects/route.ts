import { NextResponse } from 'next/server';
import fallback from '../../../data/projects.fallback.json';

export const dynamic = 'force-dynamic';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // format: owner/repo
const GITHUB_FILE_PATH = process.env.GITHUB_FILE_PATH || 'src/data/projects.fallback.json';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

interface GitHubContentResponse {
  sha: string;
  content: string;
  encoding: string;
}

async function fetchGitHubFile(): Promise<any[] | null> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json'
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data: GitHubContentResponse = await res.json();
    const decoded = Buffer.from(data.content, data.encoding as BufferEncoding).toString('utf8');
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

async function commitGitHubFile(projects: any[]) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return { ok: false, reason: 'Missing GitHub environment variables' };
  }
  // Get current sha (if exists)
  let sha: string | undefined = undefined;
  try {
    const existingRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json'
      },
      cache: 'no-store'
    });
    if (existingRes.ok) {
      const existingData: GitHubContentResponse = await existingRes.json();
      sha = existingData.sha;
    }
  } catch {}

  const newContent = Buffer.from(JSON.stringify(projects, null, 2)).toString('base64');
  const body = {
    message: `chore: update projects data (${new Date().toISOString()})`,
    content: newContent,
    sha,
    branch: GITHUB_BRANCH,
    committer: { name: 'Portfolio Bot', email: 'actions@github.com' },
    author: { name: 'Portfolio Bot', email: 'actions@github.com' }
  };

  const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json'
    },
    body: JSON.stringify(body)
  });

  if (!putRes.ok) {
    const txt = await putRes.text();
    return { ok: false, reason: txt };
  }
  return { ok: true };
}

export async function GET() {
  const remote = await fetchGitHubFile();
  if (remote) return NextResponse.json({ projects: remote, source: 'github' });
  return NextResponse.json({ projects: fallback, source: 'fallback' });
}

export async function POST(req: Request) {
  try {
    const { projects } = await req.json();
    if (!Array.isArray(projects)) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }
    const commit = await commitGitHubFile(projects);
    return NextResponse.json(commit);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
