# Historial de versiones

## 1.1.3

- La pantalla `#usuarios` muestra la dirección exacta que se pidió, el código
  HTTP que respondió y los primeros caracteres de lo que vino. Con eso el
  diagnóstico se cierra sin adivinar.
- Motivo nuevo: el servidor devolviendo `index.html` en lugar del archivo, que
  es lo que pasa con la reescritura de aplicación de una sola página.

## 1.1.2

- La aplicación distingue el fragmento de JavaScript de la consola de Firebase
  de un JSON roto, y dice cómo convertirlo.
- `herramientas/firebase-config.mjs` convierte ese fragmento en JSON válido,
  y con `--verificar` revisa el archivo existente.

## 1.1.1

- La aplicación ahora dice **por qué** no pudo conectar con Firebase, en la
  pantalla de ingreso y en `#usuarios`: archivo ausente, JSON inválido,
  credenciales incompletas o SDK inalcanzable.
- Corregido: `datos/firebase.json` estaba en `.gitignore`, así que en GitHub
  Pages nunca se publicaba y la aplicación caía al modo prototipo en silencio.

## 1.1.0

Conexión con Firebase.

- Datos en Firestore, con lectura por ventana de fechas y escritura por
  diferencias. Ninguna pantalla cambió su forma de guardar.
- Ingreso por nombre y PIN, con Firebase Authentication por debajo. La persona
  nunca ve un correo.
- Página oculta de administración de usuarios en `#usuarios`, protegida por rol
  y por Security Rules, no por lo difícil que sea adivinar la dirección.
- Cambio de PIN propio.
- Security Rules en `firestore.rules` y guía de puesta en marcha en
  `FIREBASE.md`.
- SDK falso en `herramientas/firebase-falso.mjs` para probar sin tocar un
  proyecto real.
- Sigue funcionando sin Firebase: cae al servidor local o al navegador.

## 1.0.0

Versión base. Es el punto de partida común para cualquier cliente; lo que se
agregue para uno en particular va sobre esta base.

- Productos con stock por talle, costo, margen y precio calculado
- Importación masiva pegando desde Excel, con detección automática de talles
- Venta con carrito, forma de cobro y descuento de stock
- Pedidos a proveedor con sugerencia a partir del stock bajo, e ingreso de
  mercadería al stock
- Caja con ingresos, egresos, balance y rango de fechas libre
- Informes por período con formas de cobro, talles, ranking y exportación a CSV
- Registro de quién hace cada operación
- Dos modos de guardado: archivo JSON con servidor, o navegador
- Respaldo y restauración
