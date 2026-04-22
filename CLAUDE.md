# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción
Sitio web con catálogo de productos y panel de administración para **Legado ByD**, un almacén de insumos para panaderos, pasteleros y decoración ubicado en Neuquén, Argentina.

## URLs
- **Producción:** https://legadobyd.com
- **Netlify (backup):** https://legadobyd.netlify.app
- **Repo:** https://github.com/maliandri/legado-byd
- **Instagram:** https://www.instagram.com/legadobazarydeco/

## Stack
- **Framework:** Next.js 16 (App Router, TypeScript)
- **Estilos:** Tailwind CSS v4 + inline styles con paleta propia
- **Base de datos:** Firestore (Firebase)
- **Auth:** Firebase Auth (Google OAuth + Email/Password)
- **Storage de imágenes:** Cloudinary (REST API directa, sin SDK)
- **Email:** Resend (`noreply@legadobyd.com`, dominio verificado)
- **IA:** Gemini 2.0 Flash (chatbot / descripciones masivas / generación de emails)
- **Deploy:** Netlify (via `git push` — nunca `netlify deploy --prod` desde Windows por EPERM en symlinks)

## Comandos
```bash
npm run dev    # desarrollo local
npm run build  # build producción (TypeScript + Next.js)
npm run lint
npx netlify env:set KEY value --context production  # variables de entorno
```

## Arquitectura de datos

### Firebase — dos SDKs distintos con reglas diferentes
- **Cliente SDK** (`src/lib/firebase/config.ts`): exporta `getFirebaseDb()`, `getFirebaseAuth()`, `getFirebaseStorage()`. Sujeto a Firestore security rules. Usar en componentes y hooks del cliente.
- **Admin SDK** (`src/lib/firebase/admin.ts`): exporta `adminDb()` y `adminAuth()`. Bypasea security rules. **Obligatorio en todas las API routes** que accedan a Firestore — el cliente SDK da PERMISSION_DENIED en serverless functions.

**IMPORTANTE:** No usar el proxy `db` exportado desde `config.ts` en `usuarios.ts` ni en API routes — falla con "Expected first argument to be FirebaseFirestore". Siempre llamar `getFirebaseDb()` directamente.

### Colecciones Firestore
```
productos/{id}    — nombre, descripcion, precio, categoria (slug), stock, imagen (Cloudinary URL),
                    subfamilia?, marca?, iva?, costo?, createdAt, updatedAt
categorias/{id}   — nombre, slug, emoji
usuarios/{uid}    — email, nombre, tipo ('cliente'|'empresa'), dni?, fechaNacimiento?,
                    cuit?, razonSocial?, telefono, direccion, ciudad, provincia,
                    favoritos[], perfilCompleto, bloqueado?, createdAt
otps/{uid}        — code, expiresAt, createdAt  (TTL 10 min, se elimina al verificar)
pedidos/{uid}/ordenes/{id}  — uid, items[], total, estado, createdAt
```

### FIREBASE_PRIVATE_KEY en Netlify
Netlify corrompe `\n` en env vars. La clave se guarda en base64. `admin.ts` auto-detecta:
```typescript
if (!rawKey.startsWith('-----')) {
  privateKey = Buffer.from(rawKey, 'base64').toString('utf8')  // base64
} else {
  privateKey = rawKey.replace(/\\n/g, '\n')  // PEM directo
}
```

## Flujo de autenticación

```
Login (Google popup → redirect fallback en mobile, o Email/Password)
  ↓ isAdmin (NEXT_PUBLIC_ADMIN_EMAIL)? → /admin
  ↓ perfilCompleto=true? → /mi-cuenta
  ↓ /registro paso 1: elige Cliente o Empresa
  ↓ /registro paso 2: completa datos + dispara send-otp (Admin SDK → Firestore otps/{uid})
  ↓ /registro paso 3: ingresa código OTP → verify-otp (Admin SDK) → updateUsuario → send-bienvenida → /mi-cuenta
```

**`useAuth`** (`src/hooks/useAuth.ts`): hook central. Expone `user`, `profile` (Firestore), `loading`, `isAdmin`, `isCustomer`, `redirectError`, `signInWithGoogle`, `signInWithEmail`, `signUpWithEmail`, `resetPassword`, `signOut`, `refreshProfile`. `setLoading(false)` está en `finally` para nunca quedar colgado.

Google OAuth: intenta `signInWithPopup` primero; si falla con `auth/popup-blocked` o similares, cae a `signInWithRedirect`. El redirect return se captura con `getRedirectResult` en el `useEffect`. El warning COOP (`window.closed`) es cosmético.

## Carrito
`CartContext` (`src/context/CartContext.tsx`) persiste en `localStorage` con `useReducer`. `CartDrawer` al confirmar pedido: guarda en Firestore `pedidos/{uid}/ordenes/` + llama `/api/pedido/confirmar` (no bloqueante) que envía email al cliente y al admin.

## Panel admin (`/admin`)
Protegido por `AdminGuard` (verifica `isAdmin`). Tabs:
| Tab | Funcionalidad |
|-----|---------------|
| **Productos** | CRUD, BulkImageUpload (auto-match por nombre), Descripciones IA (gemini-bulk), Publicar Sheet (import), Backup Sheet (sync) |
| **Categorías** | CRUD — el slug se auto-genera desde el nombre |
| **Emails** | `EmailMasivo`: tag-input de hasta 100 destinatarios, intervalo configurable, prompt → Gemini genera asunto+cuerpo HTML, preview, progreso con cancel. Throttling client-side via setTimeout |
| **Usuarios** | `UsuariosPanel`: listar/buscar/filtrar, bloquear (actualiza Firestore + Firebase Auth `disabled`), eliminar (Firestore + Auth), enviar email (manual o con Gemini), enviar ficha de producto |

## API Routes (`src/app/api/`)

Todas usan `export const runtime = 'nodejs'`. En Next.js 16, los params de rutas dinámicas son `Promise<{...}>` — siempre `const { uid } = await params`.

| Route | Método | Descripción |
|-------|--------|-------------|
| `auth/send-otp` | POST | Genera OTP, guarda en `otps/{uid}` via **adminDb**, envía email via Resend |
| `auth/verify-otp` | POST | Verifica y elimina OTP via **adminDb** |
| `auth/send-bienvenida` | POST | Email de bienvenida post-registro |
| `pedido/confirmar` | POST | Emails confirmación cliente + alerta admin |
| `upload` | POST | Upload a Cloudinary via REST + SHA1 (`node:crypto` — no `crypto`) |
| `gemini` | POST | Chatbot IA |
| `gemini-bulk` | POST | Descripciones masivas para productos sin descripción |
| `sync-sheets` | POST | Backup Firestore → Google Sheet |
| `import-sheets` | POST | Importa hoja "publico" → Firestore (reset? o update) |
| `admin/usuarios` | GET | Lista todos los usuarios (adminDb, ordenados por createdAt desc) |
| `admin/usuarios/[uid]` | PATCH/DELETE | Bloquear/desbloquear + Firebase Auth disable; eliminar de Firestore + Auth |
| `admin/generar-email` | POST | Gemini genera `{asunto, preview, cuerpo}` JSON para email |
| `admin/enviar-email` | POST | Envía email individual via Resend con template Legado |
| `admin/enviar-producto` | POST | Email con ficha de producto a un usuario |
| `admin/buscar-productos` | GET | Búsqueda de productos por nombre (?q=) via adminDb |

## Sistema de emails (Resend)
Todas las funciones están en `src/lib/resend/client.ts`:
- `sendOTPEmail` — código de verificación
- `sendBienvenidaEmail` — post-registro
- `sendPedidoClienteEmail` / `sendPedidoAdminEmail` — pedido por WhatsApp
- `sendContactEmail` — formulario de contacto

Emails con template propio: fondo `#F9EDD3`, header/footer `#3D1A05`, borde `#C4A040`.

## Google Sheets (`import-sheets` / `sync-sheets`)
Hoja "publico", columnas A2:L2000:

| Col | Campo | Notas |
|-----|-------|-------|
| A | `nombre` | |
| B | `categoria` | PANADERIA/DECO/BAZAR — normalizado con `norm()` |
| C | `subfamilia` | FLIA PROD |
| E | `marca` | |
| F | `precio` | coma=miles, punto=decimal |
| G | `iva` | 10.5 o 21 |
| J | `costo` | |

## Identidad visual
| Variable CSS | Hex | Uso |
|---|---|---|
| `--color-chocolate` | `#3D1A05` | Texto principal, headers, botones oscuros |
| `--color-dorado` | `#C4A040` | Bordes decorativos, acentos |
| `--color-pergamino` | `#F2E6C8` | Fondo cards |
| `--color-oliva` | `#4A5E1A` | Botones de acción |
| `--color-leche` | `#F9EDD3` | Fondo general |

Tipografía: **Playfair Display** (títulos serif) + **Inter** (cuerpo).

## Decisiones técnicas clave

**Cloudinary:** SDK oficial crashea en Netlify. Usar siempre `fetch` + `import { createHash } from 'node:crypto'` (nunca `import crypto from 'crypto'`).

**Filtrado de categorías:** `getProductosByCategoria` requiere índice compuesto. Se carga todo con `getProductos()` y se filtra en cliente.

**Undefined en Firestore:** Antes de todo `updateDoc`/`addDoc`, filtrar con `Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))` para evitar "Unsupported field value: undefined".

**Navbar categorías:** Carga desde Firestore al montar. Estado intermedio: "Legado… cargando categorías". Sin fallback hardcodeado.

**Google OAuth — dominios autorizados:** Además de Firebase Auth authorized domains, agregar en Google Cloud Console → Credentials → OAuth client:
- Authorized JavaScript origins: `https://legadobyd.com`
- Authorized redirect URIs: `https://legadobyd.com/__/auth/handler`

**Gemini API key:** Cuenta gratuita tiene límite de cuota. Si da 429, habilitar billing en aistudio.google.com o usar nueva key.

**Admin email:** Definido en `NEXT_PUBLIC_ADMIN_EMAIL` (soporta múltiples separados por coma via `NEXT_PUBLIC_ADMIN_EMAILS`). Un usuario con ese email ve el panel admin en vez del flujo de registro.

## Variables de entorno
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_CLIENT_EMAIL          # service account email
FIREBASE_PRIVATE_KEY           # clave en BASE64 (Netlify corrompe PEM directo)
FIREBASE_SERVICE_ACCOUNT_KEY   # JSON completo del service account
NEXT_PUBLIC_ADMIN_EMAIL        # email(s) admin separados por coma
RESEND_API_KEY
RESEND_FROM_EMAIL              # noreply@legadobyd.com
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
GEMINI_API_KEY
GOOGLE_SHEET_ID
NEXT_PUBLIC_WHATSAPP_NUMBER    # 5492991234567 → formateado en Footer
NEXT_PUBLIC_APP_URL            # https://legadobyd.com
```
