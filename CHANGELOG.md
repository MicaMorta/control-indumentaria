# Historial de versiones

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
