#!/bin/bash
set -e

PANEL="${PTERODACTYL_DIRECTORY:-/var/www/pterodactyl}"
MARKER="loginmaster"
KERNEL="$PANEL/app/Http/Kernel.php"
AUTH_ROUTES="$PANEL/routes/auth.php"
LOGIN="$PANEL/resources/scripts/components/auth/LoginContainer.tsx"
FORGOT="$PANEL/resources/scripts/components/auth/ForgotPasswordContainer.tsx"
FORM="$PANEL/resources/scripts/components/auth/LoginFormContainer.tsx"

patch_file() {
  local file="$1"
  local backup="$2"
  if [ ! -f "$file" ]; then
    echo "[loginmaster] Arquivo não encontrado: $file"
    exit 1
  fi
  if grep -q "$MARKER" "$file" 2>/dev/null; then
    echo "[loginmaster] Patch já aplicado em $(basename "$file")."
    return 0
  fi
  cp "$file" "$backup"
  echo "[loginmaster] Backup: $backup"
}

echo "[loginmaster] Instalando patches de segurança..."

# --- Kernel.php: middleware alias ---
if [ -f "$KERNEL" ]; then
  patch_file "$KERNEL" "$KERNEL.backup.$MARKER"
  if ! grep -q "loginmaster.turnstile" "$KERNEL"; then
    sed -i "/'recaptcha' => VerifyReCaptcha::class,/a\\        'loginmaster.turnstile' => \\\\Pterodactyl\\\\BlueprintFramework\\\\Extensions\\\\loginmaster\\\\VerifyLoginMasterTurnstile::class, // $MARKER" "$KERNEL"
    echo "[loginmaster] Middleware registrado no Kernel.php"
  fi
fi

# --- auth.php: substituir recaptcha por loginmaster ---
if [ -f "$AUTH_ROUTES" ]; then
  patch_file "$AUTH_ROUTES" "$AUTH_ROUTES.backup.$MARKER"
  sed -i "s/->middleware('recaptcha')/->middleware('loginmaster.turnstile') \/* $MARKER *\//g" "$AUTH_ROUTES"
  echo "[loginmaster] Rotas auth protegidas com middleware loginmaster.turnstile"
fi

# --- LoginContainer.tsx ---
if [ -f "$LOGIN" ]; then
  patch_file "$LOGIN" "$LOGIN.backup.$MARKER"
  python3 <<'PY' "$LOGIN"
import pathlib, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
marker = "loginmaster"

imports = """import LoginMasterTurnstile from '@blueprint/extensions/loginmaster/elements/LoginMasterTurnstile';
import useLoginMasterConfig, { loginMasterCaptchaEnabled } from '@blueprint/extensions/loginmaster/hooks/useLoginMasterConfig';
"""

if "useLoginMasterConfig" not in text:
    anchor = "import useFlash from '@/plugins/useFlash';"
    if anchor not in text:
        raise SystemExit("LoginContainer: anchor import não encontrado")
    text = text.replace(anchor, anchor + "\n" + imports)

text = text.replace("useRef<Reaptcha>(null)", "useRef<any>(null)")

hook = """    const loginMaster = useLoginMasterConfig();
    const turnstileEnabled = loginMasterCaptchaEnabled(loginMaster, 'login');
    const captchaRequired = turnstileEnabled || recaptchaEnabled;
"""
if "useLoginMasterConfig()" not in text:
    anchor = "const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);"
    if anchor not in text:
        raise SystemExit("LoginContainer: recaptcha store anchor não encontrado")
    text = text.replace(anchor, anchor + "\n" + hook)

text = text.replace("if (recaptchaEnabled && !token)", "if (captchaRequired && !token)")

old_block = """                {recaptchaEnabled && (
                    <Reaptcha
                        ref={ref}
                        size={'invisible'}
                        sitekey={siteKey || '_invalid_key'}
                        onVerify={(response) => {
                            setToken(response);
                            submitForm();
                        }}
                        onExpire={() => {
                            setSubmitting(false);
                            setToken('');
                        }}
                    />
                )}"""

new_block = """                <input type=\"text\" name=\"lm_hp_field\" className=\"loginmaster-hp\" tabIndex={-1} autoComplete=\"off\" />
                {turnstileEnabled ? (
                    <LoginMasterTurnstile
                        ref={ref}
                        siteKey={loginMaster.site_key}
                        theme={loginMaster.theme}
                        onVerify={(response) => {
                            setToken(response);
                            submitForm();
                        }}
                        onExpire={() => {
                            setSubmitting(false);
                            setToken('');
                        }}
                    />
                ) : (
                    recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    )
                )}"""

if old_block in text:
    text = text.replace(old_block, new_block)
elif "LoginMasterTurnstile" not in text:
    raise SystemExit("LoginContainer: bloco Reaptcha não encontrado")

path.write_text(text)
print("[loginmaster] LoginContainer.tsx atualizado")
PY
fi

# --- ForgotPasswordContainer.tsx ---
if [ -f "$FORGOT" ]; then
  patch_file "$FORGOT" "$FORGOT.backup.$MARKER"
  python3 <<'PY' "$FORGOT"
import pathlib, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()

imports = """import LoginMasterTurnstile from '@blueprint/extensions/loginmaster/elements/LoginMasterTurnstile';
import useLoginMasterConfig, { loginMasterCaptchaEnabled } from '@blueprint/extensions/loginmaster/hooks/useLoginMasterConfig';
"""

if "useLoginMasterConfig" not in text:
    anchor = "import useFlash from '@/plugins/useFlash';"
    if anchor not in text:
        raise SystemExit("ForgotPassword: anchor import não encontrado")
    text = text.replace(anchor, anchor + "\n" + imports)

text = text.replace("useRef<Reaptcha>(null)", "useRef<any>(null)")

hook = """    const loginMaster = useLoginMasterConfig();
    const turnstileEnabled = loginMasterCaptchaEnabled(loginMaster, 'forgot');
    const captchaRequired = turnstileEnabled || recaptchaEnabled;
"""
if "useLoginMasterConfig()" not in text:
    anchor = "const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);"
    if anchor not in text:
        raise SystemExit("ForgotPassword: recaptcha store anchor não encontrado")
    text = text.replace(anchor, anchor + "\n" + hook)

text = text.replace("if (recaptchaEnabled && !token)", "if (captchaRequired && !token)")

old_block = """                {recaptchaEnabled && (
                    <Reaptcha
                        ref={ref}
                        size={'invisible'}
                        sitekey={siteKey || '_invalid_key'}
                        onVerify={(response) => {
                            setToken(response);
                            submitForm();
                        }}
                        onExpire={() => {
                            setSubmitting(false);
                            setToken('');
                        }}
                    />
                )}"""

new_block = """                <input type=\"text\" name=\"lm_hp_field\" className=\"loginmaster-hp\" tabIndex={-1} autoComplete=\"off\" />
                {turnstileEnabled ? (
                    <LoginMasterTurnstile
                        ref={ref}
                        siteKey={loginMaster.site_key}
                        theme={loginMaster.theme}
                        onVerify={(response) => {
                            setToken(response);
                            submitForm();
                        }}
                        onExpire={() => {
                            setSubmitting(false);
                            setToken('');
                        }}
                    />
                ) : (
                    recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    )
                )}"""

if old_block in text:
    text = text.replace(old_block, new_block)
elif "LoginMasterTurnstile" not in text:
    raise SystemExit("ForgotPassword: bloco Reaptcha não encontrado")

path.write_text(text)
print("[loginmaster] ForgotPasswordContainer.tsx atualizado")
PY
fi

# --- LoginFormContainer: classe visual ---
if [ -f "$FORM" ]; then
  patch_file "$FORM" "$FORM.backup.$MARKER"
  python3 <<'PY' "$FORM"
import pathlib, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
if "loginmaster-auth" not in text:
    if "<Container>" not in text:
        raise SystemExit("LoginFormContainer: <Container> não encontrado")
    text = text.replace("<Container>", '<Container className="loginmaster-auth">', 1)
    path.write_text(text)
    print("[loginmaster] LoginFormContainer.tsx estilizado")
PY
fi

# --- Desativar reCAPTCHA nativo (settings) ---
if [ -f "$PANEL/artisan" ]; then
  php "$PANEL/artisan" tinker --execute="
    try {
      DB::table('settings')->updateOrInsert(
        ['key' => 'settings::recaptcha:enabled'],
        ['value' => serialize(false)]
      );
      echo 'recaptcha disabled';
    } catch (Throwable \$e) {
      echo 'skip recaptcha: ' . \$e->getMessage();
    }
  " 2>/dev/null || echo "[loginmaster] Aviso: não foi possível desativar reCAPTCHA via artisan (configure no admin)."
fi

echo "[loginmaster] Instalação concluída. Execute: blueprint -build && php artisan cache:clear"
