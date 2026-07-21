# Minecraft Server Properties Manager (Blueprint Addon)

Addon Blueprint focado em operacao de servidores Minecraft Java.

## O que vem pronto

- Painel admin com guia visual de instalacao e uso
- Presets publicos:
  - `survival`
  - `minigames`
  - `hardcore`
- Compatibilidade alvo: `stable-2025-04`

## Empacotar

No repositorio raiz:

```bash
./scripts/build-blueprint-package.sh
```

Arquivo final em:

```text
dist/mcserverprops-1.0.0.blueprint
```

## Instalar no painel

1. Copie o `.blueprint` para o diretorio do painel (`/var/www/pterodactyl`).
2. Rode:

```bash
blueprint -install mcserverprops
```

## Remover

```bash
blueprint -remove mcserverprops
```
