# Gym Manager

App web + móvil para la gestión de un gimnasio: reservas de clases, tienda online y perfil para los **clientes**, y venta + gestión de socios/clases/productos para el **owner**.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Supabase (Postgres + Auth con Google OAuth + Row Level Security)
- **Móvil:** Capacitor (empaqueta la misma web app como app nativa iOS/Android)

## 1. Base de datos en Supabase

Esta app vive en el **mismo proyecto Supabase** que ya usás (`vidafit-training`, el de TrainFlow) — no hace falta crear uno nuevo. Para que las dos apps no choquen entre sí, **todo el esquema de Gym Manager usa el prefijo `gm_`**: `gm_profiles`, `gm_memberships`, `gm_classes`, `gm_class_sessions`, `gm_bookings`, `gm_products`, `gm_orders`, `gm_order_items`, y las funciones `gm_current_profile_id`, `gm_is_current_owner`, `gm_create_order`. El trigger que crea el perfil al iniciar sesión (`gm_on_auth_user_created`) se agregó **además** del que ya tenía TrainFlow en `auth.users`, sin tocarlo.

Ya está todo aplicado (tablas, RLS, el trigger y la función de checkout atómico `gm_create_order`). Si alguna vez necesitás recrearlo desde cero en otro proyecto, los mismos scripts están en:
- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_create_order_rpc.sql`

(se ejecutaron igual, solo que statement por statement vía el MCP de Supabase en vez de pegados todos juntos en el SQL Editor — si los corrés ahí de una sola vez también funcionan).

### Habilitar login con Google

Esto es lo único que falta y requiere tu propia cuenta de Google (nadie más puede hacerlo por vos):

1. En el dashboard de Supabase del proyecto **vidafit-training**: **Authentication → Providers → Google**, activalo.
2. Necesitás un **Client ID** y **Client Secret** de Google. Se generan en [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Creá credenciales OAuth 2.0 tipo "Web application".
   - En **Authorized redirect URIs** agregá la URL que te muestra Supabase en esa misma pantalla (termina en `/auth/v1/callback`). Va a ser la misma URL que ya usa TrainFlow, así que si ese provider ya está configurado con Google ahí, podés reusar las mismas credenciales.
3. Pegá el Client ID y Secret en Supabase y guardá.
4. En **Authentication → URL Configuration**, agregá la URL donde corre esta app (ej. `http://localhost:5173` en desarrollo, y tu dominio en producción) a **Site URL** y **Redirect URLs**.

### Tu cuenta ya es owner

Ya dejé tu perfil (`marcelobernadet@gmail.com`) precargado en `gm_profiles` con `role = 'owner'`. En cuanto habilites Google (paso anterior) e inicies sesión con esa cuenta, el trigger vincula tu login a ese perfil automáticamente y entrás directo a la pantalla de Owner — no hace falta ningún UPDATE manual.

Para dar de alta a cualquier otra persona como owner más adelante:
```sql
update gm_profiles set role = 'owner' where lower(email) = lower('otro-email@gmail.com');
```

## 2. Configurar el proyecto localmente

```bash
npm install
cp .env.example .env
```

Completá `.env` con los valores del proyecto `vidafit-training` (Project Settings → API en el dashboard de Supabase):

```
VITE_SUPABASE_URL=https://ybugyraezxstzsngsvum.supabase.co
VITE_SUPABASE_ANON_KEY=tu-publishable-key
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
- `gm_profiles` guarda tanto a clientes como al owner. Está desacoplado de la cuenta de Google (`auth_user_id`) para que el owner pueda **dar de alta un socio nuevo** (nombre, email, teléfono, plan) *antes* de que esa persona inicie sesión. Cuando el socio entra por primera vez con Google usando ese mismo email, su cuenta se vincula automáticamente a ese perfil.
- `gm_classes` son las clases "molde" (ej: Spinning, Yoga) y `gm_class_sessions` son los horarios concretos programados (día/hora/cupo). Los clientes reservan un lugar en una sesión (tabla `gm_bookings`), con control de cupo.
- `gm_products`, `gm_orders` y `gm_order_items` cubren tanto las compras que hace un cliente desde la tienda online como las ventas que el owner carga manualmente desde el punto de venta (Venta → POS). Ambas pasan por la misma función `gm_create_order` en la base, que descuenta stock de forma atómica.

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
