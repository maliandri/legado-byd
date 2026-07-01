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
usuarios/{uid}    — email, nombre, tipo ('cliente'|'empresa'|'vendedor'), dni?, fechaNacimiento?,
                    cuit?, razonSocial?, telefono, direccion, ciudad, provincia,
                    favoritos[], perfilCompleto, bloqueado?, createdAt
otps/{uid}        — code, expiresAt, createdAt  (TTL 10 min, se elimina al verificar)
pedidos/{uid}/ordenes/{id}  — uid, items[], total, estado, createdAt
orders/{id}       — colección plana para OperacionesPanel. Campos:
                    cliente_uid?, email_cliente?, nombre_cliente?, telefono_cliente?,
                    direccion_entrega?, altura_entrega?, provincia_entrega?,
                    canal ('mercadopago'|'whatsapp'|'vendedor'),
                    vendedorId?, vendedorNombre?,
                    estado (OrdenEstado), items[], monto_total, createdAt, updatedAt?
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

**Login requerido para MercadoPago:** `CartDrawer.handlePagarConMP()` verifica `user` antes de continuar. Si no hay sesión, cierra el drawer y redirige a `/login?redirect=carrito`. En `LoginForm`, el param `redirect=carrito` muestra un banner azul explicativo. Tras login exitoso con `perfilCompleto=true`, guarda `sessionStorage.setItem('open-cart', '1')` y redirige a `/`. `CartDrawer` detecta ese flag en su `useEffect` y re-abre el carrito automáticamente.

**`login/page.tsx` + `LoginForm.tsx`:** `useSearchParams()` requiere Suspense boundary para no bloquear el prerendering de Next.js. Patrón: `page.tsx` solo exporta `<Suspense><LoginForm /></Suspense>`; toda la lógica del formulario vive en `LoginForm.tsx` (client component con `'use client'`).

## Panel admin (`/admin`)
Protegido por `AdminGuard` (verifica `isAdmin`). Tabs:
| Tab | Funcionalidad |
|-----|---------------|
| **Productos** | CRUD, BulkImageUpload (auto-match por nombre), Descripciones IA (gemini-bulk), Publicar Sheet (import), Backup Sheet (sync), **Subir precios %** (botón azul → modal con %, llama `/api/admin/subir-precios`, batch de 500), **Limpiar IVA** (botón violeta → normaliza valores corruptos vía `/api/admin/limpiar-iva`) |
| **Categorías** | CRUD — el slug se auto-genera desde el nombre |
| **Emails** | `EmailMasivo`: tag-input de hasta 100 destinatarios, intervalo configurable, prompt → Gemini genera asunto+cuerpo HTML, preview, progreso con cancel. Throttling client-side via setTimeout |
| **Usuarios** | `UsuariosPanel`: listar/buscar/filtrar, bloquear (actualiza Firestore + Firebase Auth `disabled`), eliminar (Firestore + Auth), enviar email (manual o con Gemini), enviar ficha de producto |
| **Operaciones** | Muestra colección `orders` plana. Modal de detalle muestra cliente, canal, ítems, monto, estado, **datos de entrega** (teléfono, dirección+altura, provincia) cuando están disponibles |
| **Publicar** | `PublicacionLibre`: toggle Foto/Reel. Modo Foto: buscador de productos, hasta 4 imágenes, caption IA, **vista previa 1:1 Instagram** (180×180, borde rosa), publicar en Instagram (vía Make.com webhook) o WhatsApp. Modo Reel: dropzone de video (MP4/MOV), sube directo a Cloudinary desde browser (evita límite 6MB Netlify), **vista previa 9:16** (101×180, autoplay), publica en Instagram con `type:'reel'`. En ambos modos la preview aparece entre el grid de imágenes y el campo de tema. |
| **Reel** | `ReelCreator`: 3 pasos — (1) seleccionar hasta 3 productos + tema visual, (2) editar guión IA (cada slide tiene `productoIndex` para mapear foto correcta) + seleccionar música Jamendo + selector manual de producto por slide, (3) grabar .webm con canvas + Web Audio API. Imagen del producto con Ken Burns effect, fade in/out entre slides, CTA dorado al final. Botón "Publicar en Instagram" sube webm a Cloudinary (convertido a MP4/H.264 en el upload) y lo envía a Make.com. |
| **Panfletín** | `PanfletinAdmin`: crear panfleto PDF con hasta 6 productos. Formatos A4/Carta/2×1. Templates clásica/moderna/minimalista. Doble canvas: preview escalado + offscreen full-size para export. Fuentes sistema (no Google Fonts para html2canvas). QR generado con `qrcode` lib |
| **Docs** | `DocumentacionAdmin`: genera y descarga documentación completa del sistema en formato Word (.doc HTML blob) |

## API Routes (`src/app/api/`)

Todas usan `export const runtime = 'nodejs'`. En Next.js 16, los params de rutas dinámicas son `Promise<{...}>` — siempre `const { uid } = await params`.

| Route | Método | Descripción |
|-------|--------|-------------|
| `auth/send-otp` | POST | Genera OTP, guarda en `otps/{uid}` via **adminDb**, envía email via Resend |
| `auth/verify-otp` | POST | Verifica y elimina OTP via **adminDb** |
| `auth/send-bienvenida` | POST | Email de bienvenida post-registro |
| `pedido/confirmar` | POST | Emails confirmación cliente + alerta admin |
| `upload` | POST | Upload imagen/video a Cloudinary via REST. Detecta `file.type` → usa `/image/upload` o `/video/upload`. `maxDuration=60`. Para videos grandes usar `/api/cloudinary-sign` + upload directo desde browser |
| `cloudinary-sign` | GET | Devuelve firma para upload directo desde browser a Cloudinary (evita límite 6MB Netlify). Params: `?type=video\|image` |
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
| `admin/subir-precios` | POST | Sube todos los precios un porcentaje (1–1000%). Batch de 500, `Math.round(precio * (1 + pct/100))` |
| `admin/limpiar-iva` | POST | Normaliza IVA corrupto en Firestore: `105→10.5`, rango 10–11→10.5, 20–22→21, inválido→delete |
| `admin/generar-caption` | POST | Gemini genera caption para Instagram dado lista de productos y tema |
| `admin/reel-script` | POST | Gemini genera guión de slides para ReelCreator dado lista de productos |
| `admin/music` | GET | Busca tracks en Jamendo API por tema (`?theme=panaderia\|reposteria\|deco`). Requiere `JAMENDO_CLIENT_ID` |
| `instagram/publicar` | POST | Envía payload al webhook Make.com (`MAKE_INSTAGRAM_WEBHOOK_URL`). Campos: `caption`, `imageUrl?`, `videoUrl?`, `type: 'post'\|'reel'`. **Imágenes:** aplica `CLD.instagram()` (crop 1:1, 1080px) antes de enviar para evitar error 36003. **Videos:** se envían directos — la conversión a H.264 ocurre al subir a Cloudinary, no al vuelo (evita error 2207076). |
| `mercadopago/crear-preferencia` | POST | Crea preferencia MP + guarda en `pedidos/{uid}/ordenes` y `orders`. Acepta `vendedorId`, `telefono`, `direccion`, `altura`, `provincia` |
| `mercadopago/webhook` | POST | Webhook MP: actualiza estado en `pedidos` y `orders` según payment.status |
| `vendedor/confirmar-efectivo` | POST | Guarda orden efectivo en `orders` + `pedidos/anonimo/ordenes`, descuenta stock con `FieldValue.increment(-cantidad)` |

## Sistema de emails (Resend)
Todas las funciones están en `src/lib/resend/client.ts`:
- `sendOTPEmail` — código de verificación
- `sendBienvenidaEmail` — post-registro
- `sendPedidoClienteEmail` / `sendPedidoAdminEmail` — pedido por WhatsApp
- `sendContactEmail` — formulario de contacto

Emails con template propio: fondo `#F9EDD3`, header/footer `#3D1A05`, borde `#C4A040`.

## SEO
- **`src/app/layout.tsx`**: metadata global con `metadataBase`, title template (`%s | Legado Bazar y Deco`), OG, Twitter card, `verification.google` (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`). JSON-LD `LocalBusiness` en `<head>`.
- **`src/app/sitemap.ts`**: sitemap dinámico vía `adminDb()`. Incluye páginas estáticas + `/producto/[id]` para cada producto con `lastModified`.
- **`src/app/robots.ts`**: desactiva `/admin/`, `/api/`, `/vendedor/`, `/registro/`, `/mi-cuenta/`. Referencia `/sitemap.xml`.
- **`src/app/page.tsx`** (homepage): server component (`async function`). Fetches categorías y productos vía `adminDb()` → pasa `initialProductos` a `<ProductGrid>` → los links de productos están en el HTML inicial (resuelve las ~64 páginas orphan de Ahrefs). Strips Firestore Timestamps antes de pasar como props: `const { createdAt: _c, updatedAt: _u, ...rest } = d.data()`. Exporta `export const metadata: Metadata` con title, description, OG y canonical.
- **`src/hooks/useProducts.ts`**: acepta `initialData?: Producto[]`. Si se provee, `useState` lo usa como valor inicial y `loading` empieza en `false`; `useEffect` saltea el fetch. Evita doble carga en la homepage.
- **`src/components/ProductGrid.tsx`**: acepta `initialProductos?: Producto[]` y se la pasa a `useProducts`.
- **`src/app/producto/[id]/page.tsx`**: exporta `generateMetadata` con `adminDb()` → título (máx 38 chars para que el total con sufijo quede ≤60), meta description 100–155 chars (helper `buildMetaDescription` rellena con sufijo de tienda si la descripción es corta), OG image con transform `c_fill,w_1200,h_630`, canonical. Pasa `initialProducto` a `ProductoClient`.
- **`ProductoClient`**: acepta `initialProducto?: Producto | null`. Si viene pre-cargado, no hace fetch client-side. HTML inicial tiene H1 y descripción completa (resuelve "H1 missing" en Ahrefs).
- **Imágenes optimizadas via Cloudinary:** `src/lib/cloudinary/imgUrl.ts` — helper `cloudinaryImg(url, transforms)` inserta transforms entre `/upload/` y el path. Presets en objeto `CLD`: `thumb` (400×400 crop), `detail` (800px), `og` (1200×630), `instagram` (1080×1080 crop), `reel` (9:16 crop). Usado en `ProductCard` y `ProductoClient` con `sizes` responsivos para que el navegador descargue el tamaño correcto.
- **Google Search Console**: sitio verificado. Ahrefs health score objetivo: ~100. Resuelto: orphan pages (SSR homepage), H1 missing (SSR producto), imágenes grandes (Cloudinary transforms), meta descriptions (helper 100–155 chars), títulos largos (cap 38 chars).

## Catálogo — vista galería
`ProductGrid` (`src/components/ProductGrid.tsx`) tiene toggle lista/galería para todos los usuarios. En galería: grid `grid-cols-2 sm:grid-cols-4`, cards con `aspect-ratio: 1/1`, imagen `object-cover`, gradiente oscuro de abajo, nombre (line-clamp-2) y precio en dorado superpuestos. Badge "Sin stock" si `stock === 0`.

## Panel vendedor (`/vendedor`)
`VendedorPanel` (`src/components/vendedor/VendedorPanel.tsx`):
- **Vista galería** (por defecto): grid `grid-cols-2 sm:grid-cols-3` con misma `GaleriaCard`-style. Toggle lista/galería en barra superior.
- **Filtros**: buscador por nombre, ordenar (A→Z, precio asc, precio desc, stock desc), checkbox "Solo con stock". Calculados con `useMemo`.
- **Carrito vendedor**: campos de entrega — teléfono, dirección, altura (número de puerta), provincia/localidad. Guardados en `orders` y `pedidos/{uid}/ordenes` vía API `crear-preferencia`.

## Portal cliente (`/mi-cuenta`)
- Usuarios con `tipo === 'vendedor'` ven badge "Vendedor" azul y botón "Punto de venta" en header que enlaza a `/vendedor`.
- `CartDrawer`: al confirmar pedido web, incluye automáticamente `telefono`, `direccion`, `provincia` del perfil del cliente logueado en el email y en Firestore (`orders`).

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

**Cloudinary URL transforms — imágenes vs videos:**
- **Imágenes**: los transforms en URL (`/upload/c_fill,w_1080,h_1080/...`) se aplican al instante. Seguro aplicarlos en la API route antes de enviar a Make.com o al cliente.
- **Videos**: los transforms al vuelo son **asíncronos** — Cloudinary devuelve la URL pero el video procesado no está listo inmediatamente. Si Instagram intenta descargar esa URL antes de que Cloudinary termine, falla con error 2207076. **Solución:** incluir `format: 'mp4'` en los params de upload (y en la firma) → Cloudinary convierte a MP4/H.264 de forma **síncrona durante el upload**. La URL devuelta ya es un MP4 listo. Ver `src/lib/cloudinary/upload.ts`.

**Cloudinary transforms helper:** `src/lib/cloudinary/imgUrl.ts` exporta `cloudinaryImg(url, transforms)` y el objeto `CLD` con presets listos. Usar en componentes cliente para optimizar imágenes sin re-subirlas.

**ReelCreator — `productoIndex`:** El guión IA incluye `productoIndex` (número base-0 o `null`) en cada slide. `ReelCreator` usa ese valor para asignar `imagen: selectedProductos[slide.productoIndex]?.imagen`. Evita el bug anterior donde slides de intro/cierre ciclaban productos con `i % length`. El Step 2 también tiene un `<select>` por slide para asignación manual.

**Filtrado de categorías:** `getProductosByCategoria` requiere índice compuesto. Se carga todo con `getProductos()` y se filtra en cliente.

**Undefined en Firestore:** Antes de todo `updateDoc`/`addDoc`, filtrar con `Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))` para evitar "Unsupported field value: undefined". Alternativa más legible: spread condicional `...(field ? { key: field } : {})`.

**Google Sheets — IVA bug:** `parseNum` reemplaza todas las comas antes de parsear (trata coma como separador de miles). Eso convierte `"10,5"` → `105`. La API `limpiar-iva` corrige estos valores en Firestore. Al mostrar IVA en UI usar `String(p.iva).replace('.', ',')` para formato argentino.

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
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION  # token de Google Search Console (sin "google-site-verification=")
MERCADOPAGO_ACCESS_TOKEN       # access token de MercadoPago
```
