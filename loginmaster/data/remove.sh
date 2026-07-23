#!/bin/bash
set -e

PANEL="${PTERODACTYL_DIRECTORY:-/var/www/pterodactyl}"
MARKER="loginmaster"
KERNEL="$PANEL/app/Http/Kernel.php"
AUTH_ROUTES="$PANEL/routes/auth.php"
LOGIN="$PANEL/resources/scripts/components/auth/LoginContainer.tsx"
FORGOT="$PANEL/resources/scripts/components/auth/ForgotPasswordContainer.tsx"
FORM="$PANEL/resources/scripts/components/auth/LoginFormContainer.tsx"

restore() {
  local target="$1"
  local backup="$2"
  if [ -f "$backup" ]; then
    cp "$backup" "$target"
    rm -f "$backup"
    echo "[loginmaster] Restaurado: $(basename "$target")"
  fi
}

echo "[loginmaster] Removendo patches..."

restore "$KERNEL" "$KERNEL.backup.$MARKER"
restore "$AUTH_ROUTES" "$AUTH_ROUTES.backup.$MARKER"
restore "$LOGIN" "$LOGIN.backup.$MARKER"
restore "$FORGOT" "$FORGOT.backup.$MARKER"
restore "$FORM" "$FORM.backup.$MARKER"

if [ -f "$KERNEL" ] && grep -q "loginmaster.turnstile" "$KERNEL"; then
  sed -i "/loginmaster.turnstile.*$MARKER/d" "$KERNEL"
  echo "[loginmaster] Linha de middleware removida do Kernel.php"
fi

if [ -f "$AUTH_ROUTES" ] && grep -q "loginmaster.turnstile" "$AUTH_ROUTES"; then
  sed -i "s/->middleware('loginmaster.turnstile') \/* $MARKER *\//->middleware('recaptcha')/g" "$AUTH_ROUTES"
  echo "[loginmaster] Rotas auth restauradas para recaptcha"
fi

echo "[loginmaster] Remoção concluída. Execute: blueprint -build && php artisan cache:clear"
