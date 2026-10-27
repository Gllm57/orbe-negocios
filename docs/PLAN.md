# Orbe Negocios · plan completo

El estilo (colores, letra, formas, animaciones y reglas) está en **`docs/ESTILO.md`**. Orbe Negocios conserva la estética de Orbe.

> Este plan trata solo de Orbe Negocios. Lo de Orbe personal y Orbe Plus queda fuera.

Este documento es el punto de partida de la app **Orbe Negocios**. Junta lo que se diseñó en las maquetas (https://claude.ai/artifact/G5XgQd56oAYGYSxnKFB5j4) y el código base de Orbe que ya está probado (`index.html` del repositorio `misgastos`, versión mundial).

---

## 1. Qué es y para quién

Una app **internacional** para llevar un negocio pequeño desde el teléfono, en la moneda de cada país (y en dólares donde haga falta), sin computadora ni caja registradora.

**La promesa:** «Tú vendes. Orbe hace lo repetitivo.»

Sirve para **varios tipos de negocio**. Al empezar, el dueño elige su **país** y su **tipo de negocio**, y Orbe arma la app con las secciones que le sirven. El resto queda escondido, y se puede activar después en Ajustes.

| Tipo de negocio | Ejemplos | Lo que más necesita |
|---|---|---|
| **Tienda** | Bodega, minimarket, ferretería, farmacia, ropa | Vender rápido, inventario, escáner, fiado, proveedores |
| **Comida** | Comida rápida, cafetería, panadería, food truck, comida a domicilio | Pedidos con opciones (tamaño, extras), mesas o para llevar, recetas que descuentan ingredientes |
| **Servicios con cita** | Peluquería, barbería, uñas, taller mecánico, consultorio, entrenador | Agenda de citas, recordatorios, servicios con duración, comisiones por empleado |
| **Venta en línea** | Emprendedores de Instagram, WhatsApp o TikTok, catálogo y envíos | Pedidos y su estado (pagado, enviado, entregado), catálogo en línea, envíos |
| **Independiente** | Diseñador, fotógrafo, profesor, técnico, consultor | Cotizaciones, facturas y cobros, proyectos, horas trabajadas |

Lo común a todos: ventas o cobros, clientes, gastos, ganancia real, cierre del día, reportes y equipo.

## 1a. Negocio o empresa (propuesta, pendiente de aprobar la maqueta)

Además del tipo, al empezar se elige el **tamaño**. Se puede cambiar después sin perder nada.

**Locales o sucursales:** a todos (negocio o empresa) se les pregunta cuántos locales tienen, en el paso «Tu negocio», antes de crear el perfil. La respuesta por defecto es «Uno solo», y entonces la app no habla de sucursales en ninguna parte. Si tiene más, se les pone nombre y aparecen el selector de sucursal y los gráficos por sucursal. Abrir otro local después se hace en Ajustes; lo vendido hasta ese día queda en el primero.

| | Negocio | Empresa |
|---|---|---|
| Para quién | Hasta 10 personas, uno o dos locales | Varias sucursales o un equipo grande |
| Datos al empezar | Nombre | Nombre comercial, razón social y número fiscal (RIF, NIT, RFC, RUC, CUIT, RUT, NIF, EIN, CNPJ…) y cuántas sucursales tiene |
| Equipo | Dueño, encargado y empleado | Roles con permisos uno por uno: dueño, administrador, encargado, cajero (y los que cree) |
| Clientes | Personas, con fiado | Personas y empresas, con límite de crédito, plazo (30, 60 días) y estado de cuenta |

**Lo que suma una empresa:**
- **Sucursales:** ventas, caja e inventario por sucursal; ver todas juntas o una sola; traslados de inventario entre sucursales.
- **Permisos y aprobaciones:** qué puede hacer cada rol (anular ventas, dar descuentos, ver costos, comprar, cambiar ajustes). Lo delicado pide aprobación: descuentos grandes, compras y traslados.
- **Compras:** órdenes de compra a proveedores, con aprobación, envío y recepción; el pedido sugerido arma las órdenes con lo que falta.
- **Crédito a empresas:** límite y plazo por cliente, facturas por cobrar, estados de cuenta por correo y aviso de vencidas.
- **Facturas:** con razón social y número fiscal. La factura electrónica (SENIAT, SAT, DIAN, SUNAT, ARCA, SII…) se conecta país por país con proveedores autorizados.
- **Gastos por centro de costo:** cada gasto va a una sucursal o a «Administración».
- **Reportes:** estado de resultados por sucursal, ventas por producto, impuestos del mes (y retenciones en Venezuela), en Excel o PDF, y envío al contador.
- **Registro de cambios:** quién hizo qué y cuándo (ventas anuladas, cambios de precio, aperturas de caja, accesos nuevos).
- **Seguridad:** PIN por cajero, Face ID o Windows Hello, y verificación en dos pasos obligatoria para administradores.
- **Pasar los datos:** importar productos y clientes desde Excel.

## 1b. En el teléfono y en la computadora (propuesta, pendiente de aprobar la maqueta)

La misma app sirve en las dos. En una pantalla ancha cambia la forma, no las funciones:
- **Menú lateral** con las secciones agrupadas (Día a día, Operación, Gestión) en vez de la barra de abajo.
- **Panel:** cifras del día, gráfico de 14 días (por sucursal en empresas), aprobaciones, lo que falta y últimas ventas.
- **Caja:** buscador que recibe el **lector de códigos USB**, productos a la izquierda y el ticket a la derecha. **Atajos de teclado:** F1 buscar, F2 cliente, F4 descuento, F8 fiado o crédito, F12 cobrar, Esc vaciar, Enter confirmar.
- **Tablas** con filtros y exportar a Excel para clientes, inventario, compras, gastos, facturas y registro.
- **Ventanas centradas** en lugar de hojas que suben desde abajo.
- **Impresora de tickets** de 80 mm y **gaveta de dinero** que se abre al cobrar en efectivo.
- Se instala desde Chrome o Edge en Windows y Mac, y funciona sin internet igual que en el teléfono.

## 1c. Referencia: Fina (el objetivo es parecido)

[Fina](https://www.finapartner.com/) es una startup de Caracas (2023) con un sistema administrativo en la nube para pymes venezolanas:
- Inventario, ventas, cuentas por cobrar y por pagar, y reportes de ganancia, en bolívares y dólares, desde el navegador o el teléfono.
- Páginas por tipo de negocio: bodegas, ferreterías, ropa, restaurantes y barberías (con comisiones y cuadre de caja).
- IA, crédito para negocios (Fina Presta) e integración con Cashea.
- Según sus propios datos: unos 4.000–5.000 negocios. Levantó una ronda semilla de US$1 millón en agosto de 2026.

**Orbe Negocios persigue lo mismo** (que un negocio pequeño sepa cuánto vende, cuánto le deben, qué tiene y cuánto gana), **pero se diferencia en:**
1. **Internacional desde el inicio:** monedas, formas de pago e impuestos de cada país. Fina se centra en Venezuela.
2. **Pensada para el teléfono y también para la computadora:** instalable, rápida, con gestos en el teléfono y teclado y lector de códigos en la computadora, en vez de un sistema de escritorio llevado a la fuerza al móvil.
3. **Funciona sin internet** y sincroniza después: clave en Venezuela y otros países con mala conexión.
4. **Automática:** recordatorios de cobro, pedido a proveedores, cierre del día y confirmación de pagos.
5. **Crece con el negocio:** empieza con un solo local y pasa a empresa con sucursales, permisos y facturas sin cambiar de app.
6. **Precio de entrada bajo** y prueba gratis sin tarjeta.

**Lo que conviene copiar de Fina:**
- Cuentas por pagar (proveedores y deudas del negocio), además de las de cobrar.
- Páginas y ajustes listos para cada tipo de negocio.
- A largo plazo, alianzas de crédito o de compra a cuotas (como Cashea), cuando haya historial de ventas.

## 2. Una app propia

Orbe Negocios es una app aparte, con su propio repositorio, su propia demo y sus propias tablas. Usa el mismo diseño y la misma base de código que Orbe (países y monedas, tasas, seguridad y modo sin conexión), pero nada de Orbe personal aparece en ella.

| | Orbe Negocios |
|---|---|
| Quién la usa | Dueño, empleados y, en empresas, equipos por sucursal |
| Datos | Tablas separadas: ventas, productos, clientes, citas, sucursales… |
| Cómo gana dinero | Planes de $4,99 a $49,99 |
| Pantalla principal | Ventas de hoy y caja (o la agenda de hoy); en la computadora, el panel |

## 3. Internacional desde el primer día

Se reutiliza el sistema de países de Orbe mundial (`COUNTRIES`, `setLocale`, `applyLocale`):

- **Moneda y tasas por país.** El mismo criterio que ya usa Orbe:
  - Venezuela y Argentina: dólar, euro y USDT.
  - Países con moneda estable: dólar y euro.
  - Países con dólar o euro: sin tasas.
- **Precio en dos monedas** solo donde se usa (Venezuela, Argentina, Cuba…). En el resto, una sola moneda.
- **Formas de pago según el país.** Se muestran las del país elegido y el dueño puede agregar otras:

| País | Formas de pago típicas |
|---|---|
| Venezuela | Pago Móvil, efectivo $ y Bs, USDT, Zelle, Binance Pay |
| Colombia | Nequi, Daviplata, transferencia, efectivo |
| México | SPEI, CoDi, Mercado Pago, tarjeta, efectivo |
| Perú | Yape, Plin, tarjeta, efectivo |
| Argentina | Mercado Pago, transferencia, efectivo, USDT |
| Chile | Transferencia, tarjeta, efectivo |
| Brasil | Pix, tarjeta, efectivo |
| España | Bizum, tarjeta, efectivo |
| EE. UU. | Tarjeta, Zelle, Cash App, Venmo, efectivo |

- **Impuestos configurables:** IVA, VAT o «sales tax», con el porcentaje del país ya puesto (16 % en Venezuela y México, 19 % en Colombia y Chile, 21 % en España…). Se puede apagar o cambiar, y se puede poner precio con impuesto incluido o aparte.
- **Recibos:** un recibo simple con el logo del negocio, enviado por WhatsApp o correo, funciona en todos los países. La **factura fiscal electrónica** (SENIAT, SAT, DIAN, AFIP, SII…) depende de cada país y de proveedores autorizados. Va en una fase posterior, país por país.
- **Idioma:** la app sale en español. Inglés y portugués se agregan después (Brasil y EE. UU.); los textos van separados desde el principio para que traducir sea fácil.
- **Fechas, números y husos horarios** según el país (`Intl`).

## 4. Qué se reutiliza del código de Orbe

Todo esto ya está probado en `index.html` y se copia o adapta:

- **Países, monedas y tasas:**
  - Lista de países con bandera y moneda.
  - Tasas de Venezuela (`ve.dolarapi.com`, `pydolarve.org`), mundiales (`open.er-api.com`) y USDT (CoinGecko y Binance).
- **Seguridad:**
  - Código PIN con bloqueo que no se reinicia al recargar.
  - Face ID por WebAuthn.
- **Datos a salvo:**
  - Validación al cargar.
  - Pantalla de rescate; los datos dañados nunca se borran.
  - Copias automáticas en IndexedDB.
- **Sin conexión:** service worker, manifest e iconos para instalar en la pantalla de inicio.
- **Cuentas con Supabase:**
  - Registro con contraseña dos veces y ojito.
  - Recuperar clave.
  - Renovar sesión y sincronizar.
- **Diseño y gestos:**
  - Hojas que suben desde abajo, fichas con logo y botón de confirmar fijo abajo.
  - El teclado nunca se abre solo y las animaciones son suaves.
  - Recorrido guiado.
- **Análisis con IA** (API de Anthropic) y **avisos**.

## 5. Módulos

### Comunes a todos los tipos

1. **Hoy:**
   - Ventas o cobros del día comparados con ayer, ganancia y ticket promedio.
   - Botones rápidos según el tipo de negocio.
   - Lista «Orbe trabajó por ti».
2. **Cobrar / Vender:** formas de pago del país, pago mixto, vuelto y recibo por WhatsApp.
3. **Clientes:** historial, lo que deben (fiado o cuentas por cobrar), recordatorios automáticos y notas.
4. **Gastos y cuentas por pagar:** alquiler, servicios, sueldos, compras y lo que el negocio debe a proveedores (con fecha de vencimiento y aviso), para calcular la ganancia real.
5. **Cierre del día:**
   - Lo esperado contra lo contado en cada forma de pago.
   - Resumen enviado al dueño.
6. **Automático:** tareas que se prenden y apagan, con el contador de horas ahorradas.
7. **Equipo:**
   - Roles: dueño, encargado y empleado.
   - Turnos y comisiones.
   - El empleado no ve las ganancias.
8. **Reportes:**
   - Por día, producto, servicio o empleado.
   - Excel y PDF.
   - Reporte para el contador con impuestos.

### Para empresas (propuesta)

Sucursales, permisos y aprobaciones, compras, traslados, crédito a empresas, facturas, centros de costo, reportes por sucursal y registro de cambios. El detalle está en la sección 1a.

### Según el tipo de negocio (se activan solos al elegirlo)

| Módulo | Tienda | Comida | Citas | En línea | Independiente |
|---|:-:|:-:|:-:|:-:|:-:|
| Inventario, stock mínimo y escáner | ✓ | Ingredientes | Productos que vende | ✓ | — |
| Proveedores y pedido sugerido | ✓ | ✓ | — | ✓ | — |
| Productos con opciones (tamaño, extras) | — | ✓ | — | ✓ | — |
| Mesas, para llevar y comandas | — | ✓ | — | — | — |
| Recetas (vender descuenta ingredientes) | — | ✓ | — | — | — |
| Agenda de citas y recordatorios | — | — | ✓ | — | Opcional |
| Servicios con duración y comisión | — | — | ✓ | — | — |
| Pedidos con estado (pagado, enviado, entregado) | — | Domicilio | — | ✓ | — |
| Catálogo en línea (`orbe.app/<negocio>`) | ✓ | Menú | Reservar cita | ✓ | Servicios |
| Cotizaciones y facturas | — | — | — | — | ✓ |
| Proyectos y horas | — | — | — | — | ✓ |

## 6. Datos (Supabase)

Varias personas usan el mismo negocio, así que hacen falta tablas con reglas por negocio, todas con el prefijo `neg_`:

- `neg_negocios`:
  - id, nombre, país, moneda, tipo de negocio, módulos activos y slug del catálogo.
  - Impuesto (nombre, % e incluido o no) y número fiscal (opcional: RIF, RFC, NIT, CUIT, NIF…).
  - Plan y fin de la prueba.
- `neg_miembros`: negocio, usuario y rol.
- `neg_productos`:
  - Nombre, tipo (producto o servicio), código de barras.
  - Costo, precio, impuesto, stock y mínimo.
  - Duración (servicios) y opciones (tamaño, extras).
- `neg_ventas` y `neg_venta_items`:
  - Fecha, empleado, cliente, total, impuestos y forma de pago.
  - Moneda y tasa del momento.
  - Estado (para pedidos).
- `neg_clientes` y `neg_abonos`.
- `neg_citas`: cliente, servicio, empleado, inicio, fin y estado.
- `neg_proveedores` y `neg_pedidos`.
- `neg_gastos` y `neg_cierres`.
- `neg_cotizaciones`.
- `neg_automatizaciones`.
- `neg_pedidos_web`.
- Para empresas (propuesta):
  - `neg_sucursales`; ventas, cajas, inventario y gastos llevan la sucursal.
  - `neg_roles` con sus permisos; `neg_miembros` apunta a un rol y a sus sucursales.
  - `neg_aprobaciones`: qué se pidió, quién, quién aprobó y cuándo.
  - `neg_ordenes_compra` y `neg_traslados`.
  - `neg_facturas`, con el estado ante la autoridad fiscal.
  - `neg_centros_costo`.
  - `neg_registro`: cada cambio importante, sin poder borrarse.
  - Clientes con tipo (persona o empresa), límite de crédito y plazo.

Las reglas (RLS) se basan en que el usuario sea miembro del negocio, y el rol limita lo que puede ver.

**Proyecto:**
- Al principio, **a-fuego**, con el prefijo `neg_`. **a-fuego no se pausa.**
- Con clientes de pago, conviene pasar a un proyecto propio en el plan Pro.

**Sin conexión:** las ventas se guardan primero en el teléfono, en una cola, y suben cuando vuelve el internet.

## 7. Automatizaciones

| Tarea | Cómo funciona | Dónde | Costo |
|---|---|---|---|
| Precios en moneda local con la tasa | Solo en países con dos monedas | Todos | Gratis |
| Alertas de stock y pedido sugerido | Se calculan en la app | Todos | Gratis |
| Recordatorio de citas y de pagos pendientes | **Fase 1:** WhatsApp con el mensaje listo. **Fase 2:** se envía solo (WhatsApp Business API) | Todos | Gratis o centavos por mensaje |
| Cierre del día | Aviso a la hora elegida y resumen al dueño | Todos | Gratis |
| Escáner de códigos | Cámara y librería de lectura | Todos | Gratis |
| Catálogo y reservas en línea | Página pública del negocio | Todos | Gratis |
| Reporte semanal al contador | Función en el servidor que envía el Excel por correo | Servidor | Casi gratis |
| Confirmar pagos solo (Pago Móvil, Nequi, Yape, Pix…) | Leer el aviso del banco o billetera en el teléfono | **Solo app nativa en Android** | Gratis, con publicación en Play Store |
| Cobro con tarjeta o enlace de pago | Integración con Stripe, Mercado Pago o similar, según el país | Servidor | Comisión del procesador |
| Resumen con IA | Con la API de Anthropic, como en Orbe | Todos | Centavos por análisis |

## 8. Planes

Precios en dólares, mostrados en la moneda de cada país.

| Plan | Mensual | Anual | Incluye |
|---|---|---|---|
| Emprendedor | $4,99 | $49,90 | 1 persona, 50 productos o servicios, ventas, clientes, recordatorios y catálogo o reservas en línea |
| **Negocio** (recomendado) | $9,99 | $99,90 | 3 personas, todo sin límite, escáner, agenda, proveedores, cierre del día, recibos y confirmación de pagos |
| Equipo | $19,99 | $199,90 | 10 personas, 2 sucursales, turnos y comisiones, reporte al contador con impuestos, IA y soporte prioritario |
| **Empresa** (propuesta) | $49,99 | $499,90 | 3 sucursales y 25 personas (sucursal extra a $9,99), permisos y aprobaciones, compras y traslados, crédito a empresas, facturas, registro de cambios, verificación en dos pasos, ayuda para pasar los datos y soporte prioritario |

- 14 días gratis sin tarjeta.
- Al terminar la prueba, la app queda en modo lectura. Nunca se borra nada.
- **Precio fundador:** los primeros 100 negocios pagan el plan Negocio a $4,99 de por vida, a cambio de opiniones.
- **Cómo se cobra:**
  - Tarjeta y suscripción automática para el mundo, con un servicio que maneje impuestos internacionales (por ejemplo Lemon Squeezy o Paddle).
  - Mercado Pago en Latinoamérica.
  - Pago Móvil, USDT y Binance Pay en Venezuela.
- Precio regional (opcional): un poco más bajo en países con menor ingreso.

## 9. Cómo se construye

- **Tipo de app:** app web instalable (PWA), como Orbe. Funciona en iPhone, Android y en la computadora (Windows y Mac) desde el primer día.
- **Una sola app que se adapta:** en pantallas anchas usa el menú lateral, las tablas y las ventanas centradas; en el teléfono, la barra de abajo y las hojas.
- **Código:**
  - Varios archivos: pantallas, datos, sincronización, países y textos.
  - Sin librerías pesadas.
  - Los textos van aparte, para poder traducir.
- **Módulos que se encienden y apagan:** cada tipo de negocio es una lista de módulos. Agregar un tipo nuevo no debe exigir rehacer la app.
- **App nativa:** más adelante, con Capacitor, para Play Store y App Store. Hace falta para leer los avisos de pago en Android.
- **Repositorio aparte:** `orbe-negocios`, con su propia demo.

## 10. Fases

1. **Fase 1 · El corazón (2–3 semanas):**
   - Elegir país y tipo de negocio, y vender o cobrar con las formas de pago del país.
   - Clientes y lo que deben, gastos, Hoy y cierre del día.
   - Inventario para tienda, comida y venta en línea.
   - PIN, copias y modo sin conexión.
   - Funciona en el teléfono y en la computadora (menú lateral, caja con lector de códigos y atajos).
2. **Fase 2 · Por tipo de negocio:**
   - Agenda de citas.
   - Productos con opciones, mesas y comandas.
   - Pedidos con estado.
   - Cotizaciones y facturas para independientes.
3. **Fase 3 · Nube y equipo:** tablas `neg_`, sincronización, miembros, roles y comisiones.
4. **Fase 4 · Empresas (propuesta):**
   - Sucursales, permisos por rol y aprobaciones.
   - Compras con orden, traslados entre sucursales y centros de costo.
   - Crédito a empresas, estados de cuenta y facturas con datos fiscales.
   - Reportes por sucursal, registro de cambios y verificación en dos pasos.
5. **Fase 5 · Hacia afuera:**
   - Catálogo, menú y reservas en línea.
   - WhatsApp con mensaje listo.
   - Escáner, proveedores, reportes y Excel.
6. **Fase 6 · Automático de verdad:**
   - App nativa con confirmación de pagos.
   - Recordatorios que se envían solos.
   - Reporte al contador e IA.
7. **Fase 7 · Cobrar y crecer:**
   - Planes (con el plan Empresa) y prueba de 14 días.
   - Cobro con tarjeta, Mercado Pago y USDT.
   - Inglés y portugués.
   - Factura electrónica país por país.

## 11. Preguntas por decidir

1. ¿Con qué país y qué tipo de negocio se prueba primero? La app sirve para todos, pero conviene tener 2 o 3 negocios reales probándola desde la Fase 1.
2. ¿Nombre del dominio para catálogos y reservas? (`orbe.app/negocio`, `orbenegocios.com`…)
3. ¿En qué orden van los idiomas: inglés primero (EE. UU. y latinos allá) o portugués (Brasil)?
4. ¿Precio del plan Empresa: $49,99 al mes con 3 sucursales, o un precio por sucursal?
5. ¿Cuál es el primer país para la factura electrónica de empresas?
