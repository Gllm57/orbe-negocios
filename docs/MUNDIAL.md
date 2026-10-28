# Orbe Negocios para todo el mundo

Qué falta para vender Orbe Negocios en cualquier país. Revisión del 28 oct 2026. Actualizada el mismo día con lo ya construido (✅).

Hay dos mundos muy distintos:

- **Países con descontrol monetario:** inflación alta, varias tasas de cambio, cobros en dos monedas. Ejemplos: Venezuela, Argentina, Turquía, Líbano, Nigeria, Egipto, Zimbabue, Irán, Cuba y Bolivia en 2025.
- **Países regulados:** moneda estable, pero el Estado exige factura electrónica, cajas certificadas y protección de datos. Ejemplos: México, Brasil, Colombia, Chile, Perú, la Unión Europea, Estados Unidos y Canadá.

Prioridad: 🔴 sin esto no se puede vender ahí · 🟡 importante · 🟢 suma valor.
Lo marcado con ✅ ya está hecho.

---

## Ya construido (28 oct 2026)
- **Venezuela y Argentina:**
  - Tasas oficial, paralela, USDT y propia, cada forma de pago con la suya.
  - Historial de la tasa y alerta cuando salta.
  - IGTF del 3 %.
  - Reportes en Bs o US$ con la tasa de cada día.
  - Remarcar precios en bloque y precios atados al dólar.
  - Costo de reposición.
  - Fiado en dólares.
  - Vuelto en Bs y saldo a favor.
  - Referencias de pago y conciliación con el banco.
  - Arqueo por billetes.
  - Quitar ceros a la moneda.
- **42 países:** se suman Turquía, Nigeria, Egipto, Líbano y Zimbabue (moneda local + dólar, con tasa a mano), y Bolivia también con dos monedas. Además, Alemania, Austria, Bélgica, Irlanda, Países Bajos, Polonia, Suiza, Australia, India, Filipinas, Kenia, Marruecos y Sudáfrica.
- **Impuestos:**
  - Tasa por producto: general, reducida del país o exento.
  - Desglose por tasa en el recibo.
  - Tasa general propia (sales tax de EE. UU., Brasil).
- **Integridad:**
  - Cada venta, cierre y cambio firmado con SHA-256 y encadenado; la app revisa si algo se alteró.
  - Cierre Z numerado con historial.
- **Privacidad:** permiso del cliente para guardar sus datos, exportarlos y borrarlos (quedan anónimos).

## Necesita una decisión o una cuenta externa
- **Factura electrónica** (México, Colombia, Perú, Chile, Brasil, Argentina, Venezuela, España VeriFactu…): hay que elegir un proveedor autorizado por país y abrir una cuenta (con credenciales y costo por factura).
- **Sales tax automático de EE. UU.** (Avalara o TaxJar): cuenta de pago.
- **Cobros con terminal de tarjeta** (Stripe Terminal, SumUp, Mercado Pago Point, Clip): cuenta de comercio en cada proveedor.
- **Pix, SPEI, Bizum o UPI con confirmación automática:** cuenta en un proveedor de pagos de cada país.
- **Conciliación bancaria automática** (Belvo, Fintoc, Plaid): cuenta de pago.
- **Cobrar la suscripción de Orbe** (Paddle, Lemon Squeezy o Stripe): cuenta de la empresa y precios por país.
- **Supabase:** al final, como acordamos.
- **Certificaciones europeas** (NF525, TSE, Portugal AT): proceso formal con cada país.
- **Apps en Google Play y App Store:** cuentas de desarrollador.

## Próximo bloque grande sin dependencias externas
- Inglés y portugués en toda la app.
- Impresión térmica de 80 mm, lector por cámara, descuentos, categorías, productos por peso y con variantes (tanda 2).

---

## A. Países con descontrol monetario

### Monedas y tasas
- ✅ Precios en moneda dura ($) y su valor en moneda local, con la tasa del día automática o escrita a mano.
- ✅ Tasa oficial del BCV (Venezuela); dólar oficial, blue o MEP (Argentina).
- ✅ Pagos combinados, cada parte en su moneda (Bs 2.000 por Pago Móvil + $6,52 por Binance Pay).
- ✅ Cada venta guarda la tasa con la que se cobró.
- ✅ **Varias tasas a la vez, una por forma de pago.** Ej.: Pago Móvil a tasa BCV, efectivo en dólares directo, Zelle con recargo o descuento. Hoy hay una sola tasa.
- ✅ **Tasa propia del negocio.** Muchos cobran a una tasa distinta de la oficial (promedio, paralela, USDT). Se elige cuál se muestra al cliente y cuál se usa para la contabilidad.
- ✅ **Reportes con la tasa histórica.** Que "vendí Bs 1.000.000 este mes" se vea en dólares según la tasa de cada día, no la de hoy. Si no, las ganancias mienten.
- ✅ **Historial y gráfico de la tasa**, con aviso cuando sube más de X % en el día.
- 🟡 **Cualquier moneda dura como base**, no solo el dólar: euro (Cuba), USDT o lira (Turquía).
- ✅ **Redenominación:** cuando el gobierno le quita ceros a la moneda (Venezuela lo hizo tres veces), un botón convierte todo sin perder el historial.

### Precios que se mueven todos los días
- ✅ **Remarcar precios en bloque:** subir todo X %, por categoría o por proveedor, con vista previa.
- ✅ **Precios atados al dólar** que se recalculan solos cuando cambia la tasa, con redondeo a billetes que existen.
- ✅ **Ganancia a costo de reposición:** vendiste a $10 lo que costó $6 hace un mes, pero reponerlo hoy cuesta $9. Orbe debe mostrar la ganancia real y avisar "estás vendiendo por debajo de lo que cuesta reponer".
- 🟡 Último costo, costo promedio y costo de reposición por producto; aviso cuando el proveedor sube precios.

### Deudas y vuelto
- ✅ **Fiado en moneda dura:** la deuda se queda en dólares aunque el cliente pague en bolívares otro día.
- 🟡 Recargo o interés por pagar tarde (opcional), con límite de crédito que bloquea.
- ✅ **Vuelto en otra moneda:** pagó con $20 y se le da el vuelto en Bs, o parte en Bs y parte en $.
- ✅ **Saldo a favor del cliente** cuando no hay sencillo; se usa en la próxima compra.
- ✅ **Arqueo de caja por moneda y por billete:** cuántos $, cuántos Bs, billetes de cada valor; aviso de billetes rotos o dudosos.

### Pagos locales
- ✅ **Verificar Pago Móvil y transferencias:** pedir los últimos dígitos de la referencia y el banco, y luego conciliar con el estado de cuenta (subir el archivo del banco).
- 🟡 **Cripto:** USDT (Binance Pay, TRC20/BEP20) con monto exacto y verificación por número de operación; tasa USDT propia.
- 🟢 Billeteras locales: Mercado Pago QR (AR), Ualá, MODO, Yape y Plin (PE), Nequi (CO), M-Pesa (África), Papara (TR).

### Impuestos especiales de estos países
- 🔴 **Venezuela:**
  - IGTF 3 % al cobrar en divisas o cripto, calculado aparte en el recibo.
  - Factura con imprenta digital autorizada por el SENIAT (Providencia 0071/0102), máquina fiscal o integración con un proveedor autorizado.
- 🔴 **Argentina:**
  - Factura electrónica de ARCA (ex AFIP), tipos A, B y C con CAE.
  - Percepciones y retenciones de IIBB.
  - Monotributo vs responsable inscripto.
- 🟡 **Turquía:** e-Arşiv / e-Fatura y POS (ÖKC) homologado. **Egipto:** e-invoice y e-receipt (ETA). **Nigeria:** FIRS e-invoicing.

### Condiciones del día a día
- ✅ Funciona sin internet y guarda copias diarias.
- 🔴 **Que funcione bien en teléfonos baratos y con pocos datos:**
  - App liviana, gráficos que no pesen.
  - Modo "ahorro de datos": sin fuentes ni imágenes remotas.
- 🟡 Cortes de luz: aviso de batería baja y cierre seguro; imprimir sin internet por Bluetooth.
- 🟡 Pagos a empleados en dólares o con bonos; adelantos de sueldo descontados.

---

## B. Países regulados

### Factura electrónica (lo primero que pide cada país)
- 🔴 **América Latina:**

  | País | Qué exige |
  |---|---|
  | México | CFDI 4.0 con PAC, timbrado SAT, factura global diaria del público en general |
  | Colombia | DIAN: factura electrónica y documento equivalente POS electrónico |
  | Chile | SII: boleta y factura electrónica |
  | Perú | SUNAT: boleta y factura (CPE) vía OSE |
  | Ecuador | SRI: comprobantes electrónicos |
  | Brasil | NF-e / NFC-e (SEFAZ), o NFS-e para servicios |
  | Costa Rica | Hacienda, versión 4.4 |
  | Guatemala | FEL |
  | República Dominicana | e-CF |
  | Uruguay | CFE |
  | Paraguay | SIFEN |
  | Bolivia | SIAT |
  | Panamá | Factura electrónica |

  Cómo hacerlo: un módulo por país, conectado a un proveedor autorizado (PAC, OSE…) en vez de certificarnos nosotros al principio.
- 🔴 **Europa (cajas registradoras certificadas):**

  | País | Qué exige |
  |---|---|
  | España | VeriFactu (obligatorio 2026–2027) y TicketBAI en el País Vasco |
  | Portugal | Software certificado por la AT, SAF-T PT, código ATCUD y QR en cada recibo |
  | Francia | Certificación NF525 antifraude |
  | Italia | Corrispettivi telematici / registratore telematico |
  | Alemania | KassenSichV con TSE y exportación DSFinV-K |
  | Austria | RKSV |
  | Polonia | KSeF |

  Además, la factura electrónica B2B que llega con ViDA en la UE.
- 🔴 **Recibo legal por país:** datos obligatorios, numeración correlativa sin huecos, series por caja y sucursal, copia, QR y textos legales.

### Impuestos
- ✅ **Varios impuestos y tasas por producto:**
  - Tasa general, reducida, superreducida, exento, tasa 0.
  - IEPS en México, impuestos al consumo, propinas y servicio.
  - Hoy hay un solo impuesto para todo el negocio.
- 🔴 **Estados Unidos:**
  - Sales tax por estado, condado y ciudad (integración con Avalara o TaxJar).
  - Exenciones y certificados de reventa.
  - El impuesto siempre se suma aparte del precio.
- 🔴 **Canadá:** GST, HST, PST y QST según la provincia.
- 🟡 Retenciones (ISR, IVA, ICA) cuando se le vende a una empresa.
- 🟡 Libros de IVA de compras y ventas listos para el contador.

### Datos personales y seguridad
- 🔴 **Privacidad:**
  - Leyes: GDPR (UE), LGPD (Brasil), CCPA (California), Ley 1581 (Colombia), LFPDPPP (México), Ley 25.326 (Argentina).
  - Qué implica: consentimiento al guardar datos de clientes, exportar o borrar los datos de una persona, contrato de tratamiento de datos (DPA) y datos de clientes europeos guardados en Europa.
- ✅ **Registro de cambios encadenado (inmutable):**
  - Ya tenemos el registro y las ventas anuladas no se borran. Falta firmarlo para que no se pueda alterar, que es lo que exigen VeriFactu, NF525 y otras normas.
  - Cierre Z diario numerado.
- 🔴 **Pagos con tarjeta:**
  - Nunca guardar datos de tarjetas (PCI DSS).
  - Cobrar con terminales homologadas: Stripe Terminal, SumUp, Square, Mercado Pago Point, Clip, Getnet.
  - Cumplir PSD2/SCA en Europa.
- 🟡 Entrar con Face ID o Windows Hello, verificación en dos pasos y bloqueo automático.

### Pagos y bancos
- 🟡 **Pagos instantáneos:** Pix (BR, con QR dinámico y confirmación automática), SPEI y CoDi (MX), Bizum (ES), MB Way (PT), iDEAL (NL), Interac (CA), UPI (India).
- 🟡 **Conciliación bancaria automática con banca abierta:** Open Finance en Brasil; Belvo, Prometeo o Fintoc en América Latina; GoCardless o Plaid en EE. UU. y Europa.

### Contabilidad y empleados
- 🟡 **Exportar al contador:**
  - Formatos y libros: SAF-T, plan de cuentas, libros de IVA.
  - Integraciones: QuickBooks, Xero, Alegra, Siigo, CONTPAQi, Contabilium, Holded.
- 🟡 Turnos, horas, propinas repartidas y comisiones, con las reglas de cada país.
- 🟢 Lotes y fechas de vencimiento (farmacias y alimentos), venta con restricción de edad (alcohol y tabaco).

### Accesibilidad
- 🟡 **Que la puedan usar personas con discapacidad**, con las reglas de cada región:
  - Normas: European Accessibility Act (en vigor desde 2025) y ADA en EE. UU.
  - Qué hay que cumplir: contraste, lector de pantalla y tamaño de letra.

---

## C. Para todo el mundo

### Idioma y formatos
- 🔴 **Más idiomas:**
  - Primero: inglés y portugués.
  - Después: francés, italiano, alemán y turco.
  - Más adelante: árabe, que se escribe de derecha a izquierda.
- 🔴 **Todos los países y monedas del mundo** (hoy hay 25), cada uno con sus formatos de fecha, número, dirección y teléfono, su zona horaria y sus unidades (kg o lb).
- 🟡 Recibo en el idioma del cliente.

### Cuentas, nube y varios negocios
- 🔴 **Supabase (al final, como acordamos):**
  - Cuentas de usuario y sincronización entre aparatos.
  - Cada empleado entra desde su propio teléfono.
  - Copias en la nube.
  - Datos de clientes europeos guardados en Europa.
- 🟡 **Varios negocios en una misma cuenta**, y una franquicia o cadena con reportes consolidados.

### Cobrar la suscripción en todo el mundo
- 🔴 **Precios por país según el poder de compra:** no puede costar lo mismo en Venezuela que en España.
- 🔴 **Cobrar con lo que cada país usa:**
  - Tarjeta, PayPal o Mercado Pago.
  - Pago Móvil, USDT o Zelle para Venezuela.
  - Pix para Brasil.
- 🔴 **Un "comerciante de registro"** (Paddle, Lemon Squeezy o Stripe Tax) que cobre y declare el IVA digital de cada país por nosotros.
- 🟡 Plan gratis limitado, prueba de 14 días y planes por número de cajas o sucursales.

### Equipos y canales
- 🟡 **Equipos de caja:**
  - Impresoras térmicas de 58/80 mm por USB o Bluetooth (ESC/POS).
  - Gaveta de dinero.
  - Balanza.
  - Lector de códigos por cámara.
- 🟡 **App en Android y iPhone** (Android primero en los mercados emergentes) y app de escritorio para Windows.
- 🟢 **Vender en otros canales:**
  - Catálogo en línea y pedidos por WhatsApp.
  - Mercado Libre, Shopify, Rappi, PedidosYa, iFood, Uber Eats y Glovo.

### Confianza y soporte
- 🔴 **Términos de uso y política de privacidad** por región, y un sitio web con precios por país.
- 🟡 **Soporte** por WhatsApp y correo, centro de ayuda en cada idioma y estado del servicio en línea.
- 🟢 Programa de contadores y distribuidores locales que revendan Orbe en su país.

---

## Orden sugerido

1. **Venezuela y Argentina a fondo** (A): varias tasas, remarcado, fiado en $, vuelto mixto, IGTF, verificar Pago Móvil. Es donde Orbe ya es fuerte y nadie lo hace bien.
2. **Supabase y planes de pago** (C): sin cuentas en la nube y sin cobrar no hay negocio global.
3. **Inglés y portugués, y varios impuestos por producto** (B y C).
4. **Factura electrónica país por país**, empezando por México, Colombia y Perú (mucho mercado y proveedores maduros), después Brasil, y España con VeriFactu.
5. **Europa certificada** (Portugal, Francia, Alemania, Italia): exige certificación formal, así que va al final.
