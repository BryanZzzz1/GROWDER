# SuMateCL

E-commerce de mates, bombillas, termos, materas y accesorios artesanales. La aplicación combina un catálogo público orientado a clientes con un panel privado para administrar productos, inventario, categorías y permisos de usuarios.

## Características

### Catálogo y navegación

- Catálogo principal con productos activos cargados desde Supabase.
- Navegación por categorías activas y conteo de productos por categoría.
- Búsqueda por nombre, descripción y categoría desde la barra principal.
- Página de búsqueda avanzada en `/buscar` con filtros por categoría y orden por novedades, precio ascendente o precio descendente.
- URLs con parámetros `q`, `categoria` y `orden` para conservar y compartir búsquedas.
- Filtros compatibles con categorías por ID, nombre y palabras clave de productos artesanales.

### Detalle de producto

- Página individual en `/product/[id]`.
- Galería con foto principal, miniaturas y navegación de carrusel.
- Información de precio en pesos chilenos, stock, categoría y descripción.
- Selección de color y cantidad antes de comprar.
- Acciones para añadir al carrito o comprar ahora.
- Mensaje de producto no encontrado y respaldo visual cuando falta una imagen.
- Información de despacho para Santiago y regiones de Chile.

### Carrito y compra

- Carrito global disponible en toda la aplicación.
- Vista desplegable con productos, imágenes, cantidades, subtotal y eliminación de artículos.
- Suma de cantidades cuando se agrega nuevamente un producto existente.
- Edición de cantidades y limpieza completa del carrito en el flujo de confirmación.
- Formulario de despacho con nombre, correo, teléfono, región, comuna, dirección, departamento e instrucciones.
- Validación de campos obligatorios y formato de correo.
- Costo de despacho fijo configurado en `$2.650 CLP` cuando el carrito contiene productos.
- Generación de un código de pedido con formato `SM-######` al confirmar.

> **Estado del pago:** la pantalla actual registra y confirma el pedido de forma informativa. Las opciones Mercado Pago y Webpay aparecen como métodos seleccionables, pero todavía no existe una integración real con una pasarela de pago. La ruta `/checkout` redirige a `/confirmacion-pago`.

### Usuarios y autenticación

- Registro con correo, contraseña, teléfono y fecha de nacimiento.
- Inicio de sesión con Supabase Auth.
- Redirección al destino original mediante el parámetro `redirect`.
- Inicio de sesión o registro dentro del flujo de confirmación de compra.
- Página `/cuenta` para consultar y editar teléfono y fecha de nacimiento.
- Actualización de los datos tanto en la tabla `usuario` como en los metadatos de Supabase Auth.
- Cierre de sesión.

### Panel de administración

El panel `/admin` está restringido a usuarios activos con rol de administrador o editor.

- Inventario sincronizado con la base de datos.
- Búsqueda de productos por nombre, categoría o descripción.
- Alta, edición y eliminación de productos.
- Gestión de nombre, categoría, precio, stock, descripción y estado activo.
- Creación de nuevas categorías desde el formulario de producto.
- Galería de hasta tres imágenes por producto.
- Optimización de imágenes cargadas al formato WebP/base64 mediante el utilitario de imágenes.
- Indicador de stock crítico cuando quedan tres unidades o menos.
- Gestión de usuarios y roles desde la pestaña correspondiente.
- Activación o suspensión de cuentas.

## Roles

Los permisos se controlan mediante `rol_id` y el campo `activo` de la tabla `usuario`:

| Rol | Valor | Permisos |
| --- | ---: | --- |
| Administrador | 1 | Gestiona productos, stock, categorías, usuarios y roles. |
| Editor | 2 | Gestiona productos, precios, descripciones e inventario. |
| Cliente | 3 | Explora el catálogo, usa el carrito y confirma pedidos. |

Las cuentas suspendidas pierden el acceso administrativo y, al suspenderse, se reasignan al rol de cliente.

## Rutas principales

| Ruta | Descripción |
| --- | --- |
| `/` | Inicio y catálogo de productos activos. |
| `/buscar` | Búsqueda, filtros y ordenamiento del catálogo. |
| `/product/[id]` | Detalle, galería y compra de un producto. |
| `/login` | Inicio de sesión. |
| `/registro` | Creación de cuenta. |
| `/cuenta` | Consulta y edición del perfil. |
| `/checkout` | Entrada al flujo de compra; redirige a confirmación. |
| `/confirmacion-pago` | Datos de despacho y confirmación del pedido. |
| `/admin` | Administración protegida de tienda y usuarios. |

## Stack tecnológico

- [Next.js 16](https://nextjs.org/) con App Router.
- React 19 y TypeScript.
- Supabase para autenticación y persistencia de datos.
- Tailwind CSS 4 mediante PostCSS.
- Fuentes `DM Sans` y `Fraunces` mediante `next/font`.
- Formato monetario chileno con `Intl.NumberFormat` y moneda `CLP`.

## Estructura del proyecto

```text
app/
  page.tsx                    # Inicio y catálogo
  buscar/                     # Búsqueda avanzada
  product/[id]/               # Detalle de producto
  datoscarro/                 # Contexto y vista del carrito
  login/                      # Inicio de sesión
  registro/                   # Registro de clientes
  cuenta/                     # Perfil del usuario
  checkout/                   # Entrada al checkout
  confirmacion-pago/          # Despacho y confirmación
  admin/                      # Panel de administración
  components/                 # Navbar, búsqueda y categorías
src/lib/
  supabase.ts                 # Cliente de Supabase
  context/AuthContext.tsx     # Sesión y permisos
public/                       # Logo y recursos estáticos
```

## Requisitos

- Node.js compatible con la versión de Next.js utilizada.
- npm.
- Proyecto de Supabase configurado.
- Tablas y políticas de acceso preparadas para el cliente web.

## Configuración local

1. Instala las dependencias:

	```bash
	npm install
	```

2. Crea un archivo `.env.local` en la raíz del proyecto:

	```env
	NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
	NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
	```

3. Inicia el servidor de desarrollo:

	```bash
	npm run dev
	```

4. Abre [http://localhost:3000](http://localhost:3000).

## Base de datos

La aplicación consulta y actualiza principalmente estas tablas:

- `producto`: nombre, descripción, precio, stock, categoría y estado activo.
- `imagenes`: URLs de las imágenes asociadas a cada producto mediante `productoid`.
- `categorias`: categorías visibles y administrables.
- `usuario`: perfil, teléfono, fecha de nacimiento, rol y estado de la cuenta.
- Supabase Auth: credenciales y sesión de los usuarios.

El cliente espera que las políticas RLS de Supabase permitan las operaciones correspondientes a cada tipo de usuario. La clave anónima debe utilizarse únicamente con políticas de seguridad correctamente configuradas.

## Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Compilación de producción
npm run start     # Servidor de producción
npm run lint      # Revisión de estilo y errores ESLint
```

## Despliegue

Para un despliegue de producción:

```bash
npm run build
npm run start
```

En el proveedor de despliegue deben configurarse las mismas variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, además de las tablas, autenticación y políticas RLS del proyecto de Supabase.

## Próximos pasos recomendados

- Conectar Mercado Pago o Webpay mediante una integración segura en servidor.
- Persistir los pedidos confirmados en una tabla de órdenes.
- Descontar stock después de confirmar un pago real.
- Añadir historial de pedidos y seguimiento de despacho para clientes.
- Incorporar pruebas automatizadas para filtros, carrito, permisos y checkout.
