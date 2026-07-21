import * as React from 'react';

type PropertyEntry =
  | { kind: 'blank' }
  | { kind: 'comment'; content: string }
  | { kind: 'invalid'; content: string }
  | { kind: 'property'; key: string; value: string };

const SERVER_PROPERTIES_FILE = '/server.properties';

const splitPropertyLine = (line: string): { key: string; value: string } | null => {
  const separatorIndex = line.indexOf('=');
  if (separatorIndex <= 0) return null;

  return {
    key: line.slice(0, separatorIndex).trim(),
    value: line.slice(separatorIndex + 1),
  };
};

const parseProperties = (content: string): PropertyEntry[] =>
  content.split('\n').map((line) => {
    const normalized = line.replace(/\r$/, '');
    const trimmed = normalized.trim();

    if (trimmed.length === 0) return { kind: 'blank' };
    if (trimmed.startsWith('#')) return { kind: 'comment', content: normalized };

    const parsed = splitPropertyLine(normalized);
    if (!parsed || parsed.key.length === 0) return { kind: 'invalid', content: normalized };

    return {
      kind: 'property',
      key: parsed.key,
      value: parsed.value,
    };
  });

const serializeProperties = (entries: PropertyEntry[]): string =>
  entries
    .map((entry) => {
      if (entry.kind === 'blank') return '';
      if (entry.kind === 'comment') return entry.content;
      if (entry.kind === 'invalid') return entry.content;

      return `${entry.key}=${entry.value}`;
    })
    .join('\n');

const getServerIdFromPath = (): string | null => {
  if (typeof window === 'undefined') return null;

  const match = window.location.pathname.match(/\/server\/([^/]+)/);
  return match?.[1] ?? null;
};

const getCsrfToken = (): string =>
  document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

const MinecraftPropertiesStudio = () => {
  const [entries, setEntries] = React.useState<PropertyEntry[]>([]);
  const [initialSerialized, setInitialSerialized] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  const [notice, setNotice] = React.useState<string>('');

  const serverId = React.useMemo(() => getServerIdFromPath(), []);
  const serializedCurrent = React.useMemo(() => serializeProperties(entries), [entries]);
  const isDirty = serializedCurrent !== initialSerialized;

  const invalidCount = React.useMemo(
    () => entries.filter((entry) => entry.kind === 'invalid').length,
    [entries]
  );

  const propertyRows = React.useMemo(() => {
    const lowered = search.trim().toLowerCase();
    return entries
      .map((entry, index) => ({ entry, index }))
      .filter(
        (
          item
        ): item is { entry: Extract<PropertyEntry, { kind: 'property' }>; index: number } =>
          item.entry.kind === 'property'
      )
      .filter(({ entry }) =>
        lowered.length === 0 ? true : entry.key.toLowerCase().includes(lowered)
      );
  }, [entries, search]);

  const loadFile = React.useCallback(async () => {
    if (!serverId) {
      setError('Não foi possível detectar o servidor na URL atual.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `/api/client/servers/${serverId}/files/contents?file=${encodeURIComponent(
          SERVER_PROPERTIES_FILE
        )}`,
        {
          credentials: 'include',
          headers: {
            Accept: 'text/plain, application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Falha ao carregar arquivo (${response.status})`);
      }

      const text = await response.text();
      const parsed = parseProperties(text);
      setEntries(parsed);
      setInitialSerialized(serializeProperties(parsed));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro inesperado ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  React.useEffect(() => {
    void loadFile();
  }, [loadFile]);

  const updateEntry = (targetIndex: number, updater: (entry: PropertyEntry) => PropertyEntry) => {
    setEntries((current) =>
      current.map((entry, index) => (index === targetIndex ? updater(entry) : entry))
    );
  };

  const addProperty = () => {
    setEntries((current) => [...current, { kind: 'property', key: 'new-property', value: '' }]);
    setNotice('');
    setError('');
  };

  const removeProperty = (targetIndex: number) => {
    setEntries((current) => current.filter((_, index) => index !== targetIndex));
    setNotice('');
    setError('');
  };

  const resetChanges = () => {
    setEntries(parseProperties(initialSerialized));
    setNotice('Alterações locais descartadas.');
    setError('');
  };

  const saveFile = async () => {
    if (!serverId) {
      setError('Não foi possível detectar o servidor na URL atual.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch(
        `/api/client/servers/${serverId}/files/write?file=${encodeURIComponent(
          SERVER_PROPERTIES_FILE
        )}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'text/plain;charset=UTF-8',
            'X-CSRF-TOKEN': getCsrfToken(),
          },
          body: serializedCurrent,
        }
      );

      if (!response.ok) {
        throw new Error(`Falha ao salvar arquivo (${response.status})`);
      }

      setInitialSerialized(serializedCurrent);
      setNotice('Arquivo salvo com sucesso. Reinicie o servidor para aplicar totalmente.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className='mcps-shell'>Carregando server.properties...</div>;
  }

  return (
    <div className='mcps-shell'>
      <div className='mcps-hero'>
        <div>
          <h2>Minecraft Properties Studio</h2>
          <p>Edite o arquivo server.properties com segurança, busca e salvamento em um clique.</p>
        </div>
        <div className='mcps-hero-actions'>
          <button className='mcps-btn mcps-btn-secondary' type='button' onClick={() => void loadFile()}>
            Recarregar
          </button>
          <button
            className='mcps-btn mcps-btn-ghost'
            type='button'
            onClick={resetChanges}
            disabled={!isDirty || saving}
          >
            Descartar alterações
          </button>
          <button
            className='mcps-btn mcps-btn-primary'
            type='button'
            onClick={() => void saveFile()}
            disabled={!isDirty || saving}
          >
            {saving ? 'Salvando...' : 'Salvar no servidor'}
          </button>
        </div>
      </div>

      <div className='mcps-toolbar'>
        <input
          className='mcps-input'
          placeholder='Buscar propriedade (ex: online-mode, motd...)'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className='mcps-btn mcps-btn-secondary' type='button' onClick={addProperty}>
          + Nova propriedade
        </button>
      </div>

      {error && <div className='mcps-alert mcps-alert-error'>{error}</div>}
      {notice && <div className='mcps-alert mcps-alert-success'>{notice}</div>}

      <div className='mcps-meta'>
        <span>{propertyRows.length} propriedades visíveis</span>
        <span>{isDirty ? 'Alterações pendentes' : 'Sem alterações pendentes'}</span>
        <span>{invalidCount} linhas não reconhecidas preservadas</span>
      </div>

      <div className='mcps-table-wrapper'>
        <table className='mcps-table'>
          <thead>
            <tr>
              <th>Chave</th>
              <th>Valor</th>
              <th aria-label='Ações'>Ações</th>
            </tr>
          </thead>
          <tbody>
            {propertyRows.map(({ entry, index }) => (
              <tr key={`${entry.key}-${index}`}>
                <td>
                  <input
                    className='mcps-input'
                    value={entry.key}
                    onChange={(event) =>
                      updateEntry(index, (current) =>
                        current.kind === 'property'
                          ? { ...current, key: event.target.value.replace(/\s+/g, '-') }
                          : current
                      )
                    }
                  />
                </td>
                <td>
                  <input
                    className='mcps-input'
                    value={entry.value}
                    onChange={(event) =>
                      updateEntry(index, (current) =>
                        current.kind === 'property' ? { ...current, value: event.target.value } : current
                      )
                    }
                  />
                </td>
                <td>
                  <button
                    className='mcps-btn mcps-btn-danger'
                    type='button'
                    onClick={() => removeProperty(index)}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MinecraftPropertiesStudio;
