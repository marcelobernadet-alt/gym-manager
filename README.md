# Gym Manager

App web + móvil para la gestión de un gimnasio: reservas de clases, tienda online y perfil para los **clientes**, y venta + gestión de socios/clases/productos para el **owner**.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Supabase (Postgres + Auth con Google OAuth + Row Level Security)
- **Móvil:** Capacitor (empaqueta la misma web app como app nativa iOS/Android)

## 1. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo (plan gratuito alcanza para empezar).
2. En **Project Settings → API** copiá la `Project URL` y la `anon public key`.
3. En **SQL Editor**, ejecutá en orden el contenido de:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_create_order_rpc.sql`

   Esto crea todas las tablas (`profiles`, `memberships`, `gym_classes`, `class_sessions`, `bookings`, `products`, `orders`, `order_items`), las políticas de seguridad (RLS) y el trigger que crea el perfil de cada usuario automáticamente.

### Habilitar login con Google

1. En Supabase: **Authentication → Providers → Google**, activalo.
2. Necesitás un **Client ID** y **Client Secret** de Google. Se generan en [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Creá credenciales OAuth 2.0 tipo "Web application".
   - En **Authorized redirect URIs** agregá la URL que te muestra Supabase en esa misma pantalla (termina en `/auth/v1/callback`).
3. Pegá el Client ID y Secret en Supabase y guardá.
4. En **Authentication → URL Configuration**, agregá la URL donde corre tu app (ej. `http://localhost:5173` en desarrollo, y tu dominio en producción) a **Site URL** y **Redirect URLs**.

### Convertirte en owner

Por defecto, todos los que inician sesión quedan con rol `client`. Para que tu propia cuenta sea la del dueño del gimnasio:

1. Iniciá sesión una vez en la app con tu cuenta de Google (vas a quedar como cliente).
2. En el SQL Editor de Supabase, corré:
   ```sql
   update profiles set role = 'owner' where lower(email) = lower('tu-email@gmail.com');
   ```
3. Recargá la app — ahora vas a ver la pantalla de Owner (Venta / Gestión).

## 2. Configurar el proyecto localmente

```bash
npm install
cp .env.example .env
```

Completá `.env` con los valores de tu proyecto Supabase:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_GYM_NAME=Nombre de tu gimnasio
```

```bash
npm run dev
```

## 3. Cómo está organizada la app

```
src/
  context/AuthContext.tsx     # sesión, perfil, login/logout con Google
  hooks/                      # acceso a datos (clases, reservas, productos, pedidos, socios)
  components/Client/          # pantallas del cliente: Inicio, Calendario, Tienda, Perfil
  components/Owner/           # pantallas del owner: Dashboard, Venta, Gestión
    Gestion/                  # Socios, Clases, Productos
supabase/migrations/          # esquema SQL + políticas de seguridad
```

**Modelo de datos clave:**
- `profiles` guarda tanto a clientes como al owner. Está desacoplado de la cuenta de Google (`auth_user_id`) para que el owner pueda **dar de alta un socio nuevo** (nombre, email, teléfono, plan) *antes* de que esa persona inicie sesión. Cuando el socio entra por primera vez con Google usando ese mismo email, su cuenta se vincula automáticamente a ese perfil.
- `gym_classes` son las clases "molde" (ej: Spinning, Yoga) y `class_sessions` son los horarios concretos programados (día/hora/cupo). Los clientes reservan un lugar en una `class_session` (tabla `bookings`), con control de cupo.
- `products`, `orders` y `order_items` cubren tanto las compras que hace un cliente desde la tienda online como las ventas que el owner carga manualmente desde el punto de venta (Venta → POS). Ambas pasan por la misma función `create_order` en la base, que descuenta stock de forma atómica.

## 4. Extender la app

Está pensada para crecer sin romper lo existente:
- **Nuevas secciones de Gestión:** agregá una pestaña más en `components/Owner/Gestion/GestionShell.tsx` (ej: Reportes, Personal, Asistencia).
- **Pagos online reales:** hoy el checkout registra el pedido como pagado manualmente (`payment_method: 'manual'`). Para cobrar de verdad, se puede sumar un checkout de Mercado Pago / Stripe que, tras confirmar el pago, llame a la misma función `create_order`.
- **Notificaciones:** se puede agregar un recordatorio de clase o vencimiento de membresía con Supabase Edge Functions + un cron.
- **Nuevos roles:** el campo `profiles.role` solo distingue `client`/`owner` hoy; se puede ampliar (ej: `instructor`) sin tocar el resto del esquema.

## 5. Empaquetar como app móvil (Capacitor)

```bash
npm run build
npx cap add ios       # requiere Xcode, solo en Mac
npx cap add android    # requiere Android Studio
npx cap sync
npx cap open ios       # o: npx cap open android
```

Cada vez que cambies el código web, repetí `npm run build && npx cap sync` antes de abrir el proyecto nativo.
