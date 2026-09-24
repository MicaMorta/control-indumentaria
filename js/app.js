/* Punto de entrada: arma el router, engancha los eventos y arranca. */

import { $, $$, esc, fechaLarga, avisar, cerrarDialogo } from './utilidades.js';
import { arrancar, modo, guardarYa } from './almacen.js';
import { productosEnAlerta, pedidosPorEstado } from './negocio.js';
import { ui, bus } from './estado.js';
import { verificar, recordarSesion, sesionActiva, cerrarSesion } from './auth.js';

import { vistaPanel }                                  from './vistas/panel.js';
import { vistaProductos, editorProducto, dialogoIngresarPedido } from './vistas/productos.js';
import { vistaVender, sumarAlCarrito, confirmarVenta } from './vistas/vender.js';
import { vistaImportar }                               from './vistas/importar.js';
import { vistaPedidos, editorPedido, cancelarPedido }  from './vistas/pedidos.js';
import { vistaCaja, editorMovimiento, deshacer, alternarDetalle } from './vistas/caja.js';
import { vistaInformes }                               from './vistas/informes.js';
import { vistaAjustes }                                from './vistas/ajustes.js';

const VISTAS = {
  panel:     { titulo: 'Panel',           sub: 'Cómo viene el negocio',                  pintar: vistaPanel },
  vender:    { titulo: 'Vender',          sub: 'Tocá un talle para sumarlo al carrito',   pintar: vistaVender },
  productos: { titulo: 'Productos',       sub: '',                                        pintar: vistaProductos },
  importar:  { titulo: 'Importar stock',  sub: 'Pegá las filas copiadas de tu planilla', pintar: vistaImportar },
  pedidos:   { titulo: 'Pedidos',         sub: '',                                        pintar: vistaPedidos },
  caja:      { titulo: 'Caja',            sub: 'Ventas, ingresos y egresos',             pintar: vistaCaja },
  informes:  { titulo: 'Informes',        sub: '',                                        pintar: vistaInformes },
  ajustes:   { titulo: 'Ajustes',         sub: 'Respaldo y preferencias',                pintar: vistaAjustes }
};

/* --------------------------------------------------------------------------
   ROUTER
   -------------------------------------------------------------------------- */
function pintar(){
  const v = VISTAS[ui.vista] || VISTAS.panel;
  $('#titulo').textContent = v.titulo;
  $('#subtitulo').textContent = v.sub;
  $('#rail-fecha').textContent = fechaLarga.format(new Date());

  const alerta = productosEnAlerta().length;
  const marca = $('#marca-stock');
  marca.hidden = alerta === 0;
  marca.textContent = alerta;

  const pend = pedidosPorEstado('pendiente').length;
  const marcaPed = $('#marca-pedidos');
  marcaPed.hidden = pend === 0;
  marcaPed.textContent = pend;

  v.pintar();
}

/* Importar ya no está en el menú: se entra desde el botón de Productos.
   Mientras se está ahí, el menú deja marcado Productos para que no quede
   ninguna opción encendida. */
const EN_EL_MENU = { importar: 'productos' };

function ir(destino){
  ui.vista = destino;
  ui.busqueda = '';
  const marcado = EN_EL_MENU[destino] || destino;
  $$('#nav button').forEach(b =>
    b.setAttribute('aria-current', String(b.dataset.vista === marcado)));
  $('#lienzo').scrollTop = 0;
  pintar();
}

bus.pintar = pintar;
bus.ir = ir;

/* --------------------------------------------------------------------------
   EVENTOS
   Uno solo para toda la aplicación: las vistas se redibujan enteras, así que
   enganchar oyentes a cada botón se perdería en el siguiente repintado.
   -------------------------------------------------------------------------- */
document.addEventListener('click', ev => {
  const t = ev.target;

  const nav = t.closest('#nav button');
  if (nav){ ir(nav.dataset.vista); return; }

  const atajo = t.closest('[data-ir]');
  if (atajo){ ir(atajo.dataset.ir); return; }

  if (t.closest('[data-cerrar]') || t.id === 'velo'){ cerrarDialogo(); return; }

  /* productos */
  const editar = t.closest('[data-editar]');
  if (editar){ editorProducto(editar.dataset.editar); return; }
  if (t.id === 'nuevo-producto'){ editorProducto(null); return; }
  if (t.id === 'ingresar-pedido'){ dialogoIngresarPedido(); return; }

  /* pedidos */
  if (t.id === 'nuevo-pedido' || t.id === 'nuevo-pedido-2'){ editorPedido(null); return; }
  const edPed = t.closest('[data-editar-pedido]');
  if (edPed){ editorPedido(edPed.dataset.editarPedido); return; }
  const canPed = t.closest('[data-cancelar-pedido]');
  if (canPed){ cancelarPedido(canPed.dataset.cancelarPedido); return; }

  /* vender */
  const sumar = t.closest('[data-sumar]');
  if (sumar && !sumar.disabled){ sumarAlCarrito(sumar.dataset.sumar, sumar.dataset.talle); return; }
  const quitar = t.closest('[data-quitar]');
  if (quitar){ ui.carrito.splice(+quitar.dataset.quitar, 1); vistaVender(); return; }
  if (t.id === 'vaciar-carrito'){ ui.carrito = []; vistaVender(); return; }
  if (t.id === 'cobrar'){ confirmarVenta(); return; }

  /* caja */
  if (t.id === 'nuevo-egreso'){ editorMovimiento('egreso'); return; }
  if (t.id === 'nuevo-ingreso'){ editorMovimiento('ingreso'); return; }
  const des = t.closest('[data-deshacer]');
  if (des){ deshacer(des.dataset.deshacer, des.dataset.clase); return; }
  const ver = t.closest('[data-ver]');
  if (ver){ alternarDetalle(ver.dataset.ver); return; }

  /* sesión */
  if (t.id === 'salir'){ salir(); return; }
});

/* Las dos fechas del rango libre. `change` y no `click`, por eso va aparte. */
document.addEventListener('change', ev => {
  const t = ev.target;
  const mapa = [
    ['data-rango-caja-desde',    ui.rangoCaja,    'desde', vistaCaja],
    ['data-rango-caja-hasta',    ui.rangoCaja,    'hasta', vistaCaja],
    ['data-rango-informe-desde', ui.rangoInforme, 'desde', vistaInformes],
    ['data-rango-informe-hasta', ui.rangoInforme, 'hasta', vistaInformes]
  ];
  for (const [attr, destino, campo, pintarVista] of mapa){
    if (t.hasAttribute && t.hasAttribute(attr)){
      destino[campo] = t.value;
      destino.clave = 'personalizado';
      pintarVista();
      return;
    }
  }
});

document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') cerrarDialogo();
});

/* Si quedó algo sin escribir y se cierra la pestaña, se fuerza el guardado. */
window.addEventListener('beforeunload', () => { guardarYa(); });

/* --------------------------------------------------------------------------
   INGRESO
   -------------------------------------------------------------------------- */
async function entrar(){
  const usuario = $('#ing-usuario').value;
  const clave   = $('#ing-clave').value;
  const btn = $('#ing-entrar');
  btn.disabled = true;

  try{
    const u = await verificar(usuario, clave);
    if (!u){
      $('#ing-error').textContent = 'Usuario o contraseña incorrectos.';
      $('#ing-error').hidden = false;
      $('#ing-clave').value = '';
      $('#ing-clave').focus();
      return;
    }
    recordarSesion(u);
    await abrirApp(u);
  }catch(e){
    $('#ing-error').textContent = 'No se pudo leer datos/usuarios.json.';
    $('#ing-error').hidden = false;
  }finally{
    btn.disabled = false;
  }
}

async function abrirApp(u){
  ui.usuario = u;
  $('#ingreso').hidden = true;
  $('#app').hidden = false;
  $('#rail-usuario').textContent = u.nombre;
  $('#marca-modo').textContent = modo === 'servidor' ? 'Guardando en el JSON' : 'Guardando en este equipo';
  ir('panel');
}

function salir(){
  cerrarSesion();
  ui.usuario = null;
  ui.carrito = [];
  $('#app').hidden = true;
  $('#ingreso').hidden = false;
  $('#ing-clave').value = '';
  $('#ing-error').hidden = true;
}

/* --------------------------------------------------------------------------
   ARRANQUE
   -------------------------------------------------------------------------- */
(async function inicio(){
  $('#ing-entrar').onclick = entrar;
  $('#ing-clave').addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });
  $('#ing-usuario').addEventListener('keydown', e => { if (e.key === 'Enter') $('#ing-clave').focus(); });

  await arrancar();

  const u = sesionActiva();
  if (u) await abrirApp(u);
  else $('#ing-usuario').focus();
})();
