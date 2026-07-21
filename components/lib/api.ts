/**
 * MC Hub — thin wrapper around the Pterodactyl client API for file
 * operations on the current server. All endpoints live on the same origin,
 * so we rely on the CSRF cookie (`XSRF-TOKEN`) already set by Pterodactyl.
 */

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : '';
}

function extractServerUuid(): string {
  const m = window.location.pathname.match(/\/server\/([^/]+)/);
  return m ? m[1] : '';
}

const csrfHeaders: Record<string, string> = {};
const xsrf = getCookie('XSRF-TOKEN');
if (xsrf) csrfHeaders['X-XSRF-TOKEN'] = xsrf;

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...csrfHeaders,
      ...extraHeaders,
    },
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.errors && Array.isArray(data.errors) && data.errors[0]?.detail) {
        msg = data.errors[0].detail;
      }
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  // For text/plain endpoints (file contents).
  return (await res.text()) as unknown as T;
}

export function serverUuid(): string {
  return extractServerUuid();
}

/** Read raw file contents. Pterodactyl returns text/plain. */
export async function readFile(file: string): Promise<string> {
  const uuid = extractServerUuid();
  const url = `/api/client/servers/${uuid}/files/contents?file=${encodeURIComponent(file)}`;
  return await request<string>('GET', url);
}

/** Write raw file contents. Pterodactyl expects text/plain. */
export async function writeFile(file: string, contents: string): Promise<void> {
  const uuid = extractServerUuid();
  const url = `/api/client/servers/${uuid}/files/write?file=${encodeURIComponent(file)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain', ...csrfHeaders },
    credentials: 'same-origin',
    body: contents,
  });
  if (!res.ok) throw new Error(`Failed to write file (HTTP ${res.status})`);
}

/** List directory contents. */
export async function listDirectory(dir: string): Promise<
  Array<{ name: string; mode: string; size: number; is_file: boolean; is_symlink: boolean; mimetype: string }>
> {
  const uuid = extractServerUuid();
  const url = `/api/client/servers/${uuid}/files/list?directory=${encodeURIComponent(dir)}`;
  const data = await request<{ data: Array<{ attributes: any }> }>('GET', url);
  return (data?.data ?? []).map(item => item.attributes);
}

/** Delete files from a directory. */
export async function deleteFiles(root: string, files: string[]): Promise<void> {
  const uuid = extractServerUuid();
  await request(`POST`, `/api/client/servers/${uuid}/files/delete`, { root, files });
}

/** Trigger the daemon to pull a remote URL into a directory. */
export async function pullRemoteFile(
  url: string,
  directory: string,
  filename?: string,
): Promise<void> {
  const uuid = extractServerUuid();
  await request(`POST`, `/api/client/servers/${uuid}/files/pull`, {
    url,
    directory,
    filename,
    use_header: true,
    foreground: false,
  });
}
