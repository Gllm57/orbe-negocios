# Lo que le falta a Orbe Negocios

Revisión de la muestra funcional (27 oct 2026). Ordenado por importancia.

## 1. Imprescindible antes de tener clientes reales
- [ ] **Cuentas y nube (Supabase):** registro e inicio de sesión, datos sincronizados entre aparatos, cada empleado entra desde su propio teléfono y la cola sin conexión sube sola. Hoy todo vive en un solo aparato: si se pierde o se borra el navegador, se pierde todo (salvo la copia descargada).
- [ ] **Restaurar una copia:** hoy se puede descargar, pero no volver a cargarla.
- [ ] **Anular o devolver una venta** (con permiso y registro de quién lo hizo), y **editar o borrar** gastos, clientes y productos.
- [ ] **Cambiar los datos del negocio** después de crearlo: nombre, razón social, número fiscal, país y moneda.
- [ ] **Tasa manual en Venezuela** cuando no hay internet o se quiere otra tasa; dólar blue o MEP en Argentina.
- [ ] **Guardar en IndexedDB** en vez de localStorage: con muchos meses de ventas se llena (hoy ~400 KB por mes de ejemplo).

## 2. Para vender mejor
- [ ] Descuentos por producto o por venta (con permiso).
- [ ] Escáner con la cámara del teléfono (en la computadora ya funciona el lector USB).
- [ ] Categorías y filtros en la caja; buscar productos en el teléfono por categoría.
- [ ] Productos por peso (kg) y con variantes (talla, tamaño, sabor); fotos de productos.
- [ ] Apertura de caja con fondo inicial, entradas y retiros de efectivo, e historial de cierres.
- [ ] Límite de crédito aplicado de verdad: avisar o bloquear el fiado al pasarse.
- [ ] Recibo con logo; impresión con formato propio en impresora térmica de 80 mm.

## 3. Dinero y reportes
- [ ] Elegir cualquier rango de fechas; comparar sucursales y empleados.
- [ ] Excel real (.xlsx) y PDF con formato (hoy el PDF imprime la pantalla).
- [ ] Estado de cuenta de cada cliente en PDF o WhatsApp.
- [ ] Proveedores y compras: cuentas por pagar ligadas al proveedor y pedido sugerido (Fase 4).
- [ ] Factura electrónica país por país (Fase 6).

## 4. Equipo y seguridad
- [ ] Face ID / Windows Hello (WebAuthn), como en Orbe personal.
- [ ] Bloqueo automático tras unos minutos sin uso y límite de intentos de PIN.
- [ ] Registro de cambios (quién anuló, quién cambió un precio) visible para el dueño.
- [ ] Turnos y comisiones por empleado.

## 5. Por tipo de negocio (Fase 2)
- [ ] Agenda de citas y recordatorios (servicios con cita).
- [ ] Mesas, para llevar y comandas; recetas que descuentan ingredientes (comida).
- [ ] Pedidos con estado: pagado, enviado, entregado (venta en línea).
- [ ] Cotizaciones, facturas y horas trabajadas (independientes).

## 6. Hacia afuera y crecer
- [ ] Catálogo, menú o reservas en línea con enlace propio (Fase 4).
- [ ] Recordatorios que se envían solos por WhatsApp y confirmación automática de pagos (Fase 5, app nativa).
- [ ] Avisos: cuentas por vencer, stock bajo y hora del cierre.
- [ ] Recorrido guiado la primera vez.
- [ ] Planes, prueba de 14 días y cobro (Fase 6); inglés y portugués.
- [ ] Varios negocios en la misma cuenta y cambiar entre ellos.

## 7. Calidad
- [ ] Pruebas automáticas en el repositorio (hoy se prueba con scripts aparte).
- [ ] Revisión de accesibilidad con lector de pantalla.
- [ ] Ícono «maskable» propio para Android y pantallas de inicio de iPhone.
