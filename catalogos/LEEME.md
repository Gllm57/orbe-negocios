# Catálogos de Orbe Apps

Catálogo con pedidos por WhatsApp para negocios. Cada negocio tiene su carpeta; todos usan la misma base.

- `base/catalogo.css` y `base/catalogo.js`: el catálogo (no se tocan por cliente).
- `base/pagina.html`: la página que se copia como `index.html` en cada carpeta.
- `plantilla-productos.csv`: columnas de la hoja de productos.
- `dulce-hogar/`: catálogo de muestra.

## Crear el catálogo de un negocio nuevo

1. Copia la carpeta `dulce-hogar/` con el nombre del negocio, en minúsculas y con guiones (por ejemplo `nails-delivery-bog/`).
2. Edita `negocio.js`: nombre, rubro, ciudad, iniciales o logo, color, número de WhatsApp para pedidos, horario, aviso, moneda, domicilio y retiro, y formas de pago.
3. Pon sus productos en `productos.csv` o, mejor, en su hoja de Google (abajo).
4. Publica. El catálogo queda en `https://orbe7apps.github.io/orbe-negocios/catalogos/<carpeta>/`.
5. Haz un pedido de prueba y confirma que llega a su WhatsApp.

Con `whatsapp` vacío el catálogo funciona como muestra: al enviar, muestra el mensaje que le llegaría al negocio en vez de abrir WhatsApp. Sirve para las muestras gratis.

## Conectar la hoja de Google del negocio

1. Crea una hoja de cálculo con la cuenta de Google del negocio y pega la primera fila de `plantilla-productos.csv`: **Producto, Precio, Categoría, Descripción, Foto, Hay**.
2. Llena una fila por producto. En **Hay** escribe `no` para marcarlo como agotado. **Foto** acepta un enlace de imagen o de Google Drive (compartido como "Cualquier persona con el enlace").
3. En la hoja: **Archivo › Compartir › Publicar en la web**, elige la pestaña de productos y el formato **Valores separados por comas (.csv)**, y toca **Publicar**.
4. Copia el enlace que termina en `output=csv` y pégalo en `hoja` dentro de `negocio.js`.

Desde ahí, cada cambio que el negocio haga en su hoja aparece en el catálogo en unos minutos, sin volver a publicar. Si la hoja no responde, el catálogo usa `productos.csv` como respaldo.
