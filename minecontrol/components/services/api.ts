import http from '@/api/http';

const BASE = '/extensions/minecontrol';

export type PluginEntry = {
  name: string;
  path: string;
  size: number;
  modified_at?: string | null;
  enabled: boolean;
};

export type PropertyField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'password';
  default?: string;
  help?: string;
  min?: number;
  max?: number;
  options?: string[];
  group: string;
  group_label: string;
  value: string;
  present: boolean;
};

export type PropertyGroup = {
  id: string;
  label: string;
  description: string;
};

export async function listPlugins(serverUuid: string, directory: 'plugins' | 'mods' = 'plugins') {
  const { data } = await http.get(`${BASE}/plugins`, {
    params: { serverUuid, directory },
  });
  return data as { success: boolean; plugins: PluginEntry[]; directory: string; message?: string };
}

export async function installPlugin(payload: {
  serverUuid: string;
  downloadUrl: string;
  filename: string;
  directory?: 'plugins' | 'mods';
}) {
  const { data } = await http.post(`${BASE}/plugins/install`, payload);
  return data as { success: boolean; path?: string; message?: string };
}

export async function removePlugins(payload: {
  serverUuid: string;
  files: string[];
  directory?: 'plugins' | 'mods';
}) {
  const { data } = await http.post(`${BASE}/plugins/remove`, payload);
  return data as { success: boolean; removed?: string[]; message?: string };
}

export async function togglePlugin(payload: {
  serverUuid: string;
  filename: string;
  enable: boolean;
  directory?: 'plugins' | 'mods';
}) {
  const { data } = await http.post(`${BASE}/plugins/toggle`, payload);
  return data as { success: boolean; filename?: string; enabled?: boolean; message?: string };
}

export async function searchModrinth(params: {
  query?: string;
  offset?: number;
  limit?: number;
  facets?: string;
  index?: string;
}) {
  const { data } = await http.get(`${BASE}/plugins/search`, { params });
  return data as { success: boolean; data?: any; message?: string };
}

export async function getModrinthVersions(projectId: string) {
  const { data } = await http.get(`${BASE}/plugins/versions`, {
    params: { projectId },
  });
  return data as { success: boolean; versions?: any[]; message?: string };
}

export async function getProperties(serverUuid: string) {
  const { data } = await http.get(`${BASE}/properties`, {
    params: { serverUuid },
  });
  return data as {
    success: boolean;
    exists?: boolean;
    groups?: PropertyGroup[];
    fields?: PropertyField[];
    extras?: { key: string; value: string }[];
    message?: string;
  };
}

export async function saveProperties(payload: {
  serverUuid: string;
  values: Record<string, string | boolean | number>;
  extras?: { key: string; value: string }[];
  create_backup?: boolean;
}) {
  const { data } = await http.post(`${BASE}/properties`, payload);
  return data as { success: boolean; message?: string };
}

export async function backupProperties(serverUuid: string) {
  const { data } = await http.post(`${BASE}/properties/backup`, { serverUuid });
  return data as { success: boolean; message?: string };
}

export async function restoreProperties(serverUuid: string) {
  const { data } = await http.post(`${BASE}/properties/restore`, { serverUuid });
  return data as { success: boolean; message?: string };
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
