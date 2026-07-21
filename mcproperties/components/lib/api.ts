import http from '@/api/http';

// Lê o conteúdo bruto do server.properties através da API de arquivos do Pterodactyl.
export const getServerProperties = (uuid: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/files/contents`, {
            params: { file: '/server.properties' },
            transformResponse: (res) => res,
            responseType: 'text',
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};

// Grava o server.properties de volta pela API de arquivos.
export const saveServerProperties = async (uuid: string, content: string): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/files/write`, content, {
        params: { file: '/server.properties' },
        headers: {
            'Content-Type': 'text/plain',
        },
    });
};

// Envia um sinal de energia (usado no botão de reiniciar após salvar).
export const sendPowerAction = async (uuid: string, signal: 'start' | 'stop' | 'restart' | 'kill'): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/power`, { signal });
};
