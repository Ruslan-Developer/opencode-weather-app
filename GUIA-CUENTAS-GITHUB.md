# Guía: cómo subir proyectos a mis cuentas de GitHub

Esta guía resume cómo está configurado Git en este equipo para trabajar con
las tres cuentas de GitHub y qué pasos seguir para subir un proyecto a una
cuenta concreta.

## Cuentas y credenciales

Las credenciales se guardan en `C:\Users\USUARIO\.git-credentials`
(una línea por cuenta, gestionada por el helper `store`):

| Cuenta | Tipo de token | ¿Caduca? |
|--------|---------------|----------|
| `DebugHero-RuslanDev` | `ghp_` (PAT classic) | Sí, en la fecha elegida al crearlo |
| `Ruslan-Developer` | `gho_` (OAuth, Git Credential Manager) | No (salvo revocación o 1 año sin usar) |
| `Alexandrovich007` | `gho_` (OAuth) | No (salvo revocación o 1 año sin usar) |

**Regla de oro:** Git no adivina la cuenta. Cada repositorio local necesita
saber a qué cuenta pertenece (ver paso 4 abajo).

## Subir un proyecto nuevo a una cuenta

### 1. Crear el repo en GitHub (una vez)

Entra en <https://github.com/new> **con la sesión iniciada en la cuenta
correcta** y crea el repositorio **vacío** (sin README, sin .gitignore y sin
licencia, para evitar conflictos en el primer push).

### 2. Preparar el proyecto local (solo la primera vez)

```bash
cd C:\ruta\del\proyecto
git init
git add .
git commit -m "Primer commit"
```

### 3. Conectar el proyecto con GitHub

```bash
git remote add origin https://github.com/NOMBRE-CUENTA/NOMBRE-REPO.git
```

Sustituye `NOMBRE-CUENTA` por la cuenta dueña del repo y `NOMBRE-REPO` por el
nombre que le diste en el paso 1.

### 4. ⚠️ Indicar qué cuenta usar (paso clave)

```bash
git config credential.username NOMBRE-CUENTA
```

- Repos de `Ruslan-Developer` → `git config credential.username Ruslan-Developer`
- Repos de `Alexandrovich007` → `git config credential.username Alexandrovich007`
- Repos de `DebugHero-RuslanDev` → `git config credential.username DebugHero-RuslanDev`

Este comando se ejecuta **una vez por repositorio** y queda guardado para
siempre en el `.git/config` local del proyecto.

### 5. Subir el código

```bash
git push -u origin main
```

El `-u` deja la rama `main` rastreada contra `origin`; los siguientes pushes
de ese proyecto serán solo `git push`.

## Comprobar la configuración de un repo

```bash
# ¿A qué cuenta está asociado este repo?
git config credential.username

# ¿A qué remoto apunta?
git remote -v
```

## Problemas frecuentes

### `remote: Repository not found.`

Casi siempre significa una de estas tres cosas:

1. El repo no existe todavía en GitHub (revísalo en github.com)
2. El repo es **privado** y estás autenticando con otra cuenta → revisa el
   paso 4 (`git config credential.username`)
3. El remote apunta a la URL equivocada → corrígelo con:
   `git remote set-url origin https://github.com/CUENTA/REPO.git`

### Git me pide usuario/contraseña o abre el navegador

Git Credential Manager no encontró credencial para esa consulta. Comprueba el
paso 4 y que `~/.git-credentials` contenga la entrada de esa cuenta.

### El token de `DebugHero-RuslanDev` dejó de funcionar

Es un PAT classic con fecha de caducidad. Se comprueba y renueva en
<https://github.com/settings/tokens>: crea uno nuevo con scope `repo` y
actualiza la línea correspondiente en `C:\Users\USUARIO\.git-credentials`:

```
https://DebugHero-RuslanDev:NUEVO_TOKEN@github.com
```

## Configuración global aplicada (referencia)

- `credential.helper = store` (archivo `~/.git-credentials`)
- `credential.https://github.com.helper` redefinido en `~/.gitconfig` para que
  Git Credential Manager no interfiera con la cuenta equivocada en github.com
- Cada repo declara su cuenta con `credential.username` en su config local

## Respaldos

- `~/.git-credentials.bak-Alexandrovich007` — credencial original previa a la
  migración
- `~/.git-credentials.bak-multi` — copia con las tres entradas antes de la
  reorganización

Pueden borrarse una vez confirmado que todo funciona.
