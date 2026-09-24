/* Todo lo que se toca al mover el proyecto de lugar vive acá. */

export const RUTAS = {
  usuarios: 'datos/usuarios.json',   // usuarios y contraseñas (hash)
  inicial:  'datos/inicial.json',    // base de arranque
  api:      'api/base'               // solo existe si corrés servidor/servidor.mjs
};

export const CLAVE_LOCAL  = 'indumentaria.base.v1';
export const CLAVE_SESION = 'indumentaria.sesion';

/* Cantidad por defecto a partir de la cual un talle se marca como "reponer".
   Después se puede cambiar desde Ajustes y queda guardado en la base. */
export const UMBRAL_POR_DEFECTO = 2;

/* Hasta cuántas unidades por talle apunta a llevar un pedido sugerido.
   El programa sabe QUÉ reponer mirando el stock; cuánto pedir es una decisión
   del negocio, así que es un número configurable desde Ajustes y no una
   constante escondida en el código. */
export const REPONER_HASTA_POR_DEFECTO = 6;

export const ESTADOS_PEDIDO = {
  pendiente: 'Pendiente',
  recibido:  'Recibido',
  cancelado: 'Cancelado'
};

/* Formas de cobro que ofrece la pantalla de venta.
   Para agregar una, sumá una línea acá: aparece sola en el carrito, en la
   caja y en los informes. El `id` es lo que queda guardado en cada venta,
   así que no conviene cambiarlo una vez que hay ventas cargadas. */
export const MEDIOS_PAGO = [
  { id: 'efectivo',     nombre: 'Efectivo' },
  { id: 'transferencia',nombre: 'Transferencia' },
  { id: 'mercadopago',  nombre: 'Mercado Pago' },
  { id: 'debito',       nombre: 'Tarjeta de débito' },
  { id: 'credito',      nombre: 'Tarjeta de crédito' },
  { id: 'otro',         nombre: 'Otro' }
];

export const MEDIO_POR_DEFECTO = 'efectivo';

export const nombreMedio = id =>
  (MEDIOS_PAGO.find(m => m.id === id) || {}).nombre || 'Sin especificar';
