/* --------------------------------------------------------------------------
   CAPA DE DATOS

   Todo el resto del programa lee `datos` y llama a `guardar()`. Nadie más sabe
   de dónde salen los datos ni a dónde van. Eso es a propósito: el día que esto
   pase a Firestore se reescribe únicamente este archivo.

   Dos modos, y se eligen solos al arrancar:

   - servidor : hay alguien escuchando en `api/base` (servidor/servidor.mjs).
                Guarda de verdad en datos/base.json.
   - local    : no hay servidor (por ejemplo GitHub Pages). Lee la base inicial
                del JSON, trabaja contra el navegador y se exporta a mano.
   -------------------------------------------------------------------------- */

import { RUTAS, CLAVE_LOCAL, UMBRAL_POR_DEFECTO, REPONER_HASTA_POR_DEFECTO } from './config.js';
import { avisar } from './utilidades.js';

const VACIA = () => ({
  version: 1,
  umbral: UMBRAL_POR_DEFECTO,
  reponerHasta: REPONER_HASTA_POR_DEFECTO,
  productos: [], ventas: [], movimientos: [], pedidos: []
});

/* Object.assign deja pasar un `pedidos: undefined` de una base vieja, y
   después revienta al recorrerlo. Cada arreglo se completa a mano. */
function conArreglos(d){
  const base = VACIA();
  const r = Object.assign(base, d || {});
  ['productos', 'ventas', 'movimientos', 'pedidos']
    .forEach(k => { if (!Array.isArray(r[k])) r[k] = []; });
  if (typeof r.umbral !== 'number') r.umbral = UMBRAL_POR_DEFECTO;
  if (typeof r.reponerHasta !== 'number') r.reponerHasta = REPONER_HASTA_POR_DEFECTO;
  return r;
}

export let datos = VACIA();
export let modo = 'local';          // 'servidor' | 'local'

const normalizar = d => conArreglos(d);

/* ---- arranque ---------------------------------------------------------- */

export async function arrancar(){
  /* 1. ¿hay servidor? */
  try{
    const r = await fetch(RUTAS.api, { headers: { 'Accept': 'application/json' } });
    if (r.ok){
      datos = normalizar(await r.json());
      modo = 'servidor';
      return modo;
    }
  }catch(e){ /* no hay servidor, seguimos en local */ }

  modo = 'local';

  /* 2. ¿hay algo guardado en este navegador? */
  try{
    const crudo = localStorage.getItem(CLAVE_LOCAL);
    if (crudo){
      datos = normalizar(JSON.parse(crudo));
      return modo;
    }
  }catch(e){ /* almacenamiento bloqueado o JSON roto: seguimos a la semilla */ }

  /* 3. primera vez: se copia la base inicial del repositorio */
  try{
    const r = await fetch(RUTAS.inicial);
    if (r.ok){
      datos = normalizar(await r.json());
      guardarYa();
    }
  }catch(e){
    avisar('No se pudo leer datos/inicial.json', true);
  }
  return modo;
}

/* ---- guardado ---------------------------------------------------------- */

let reloj = null;
let enVuelo = false;

/* Se llama muchas veces seguidas (cada tecla del editor, cada línea del
   carrito). Se agrupan en una sola escritura para no castigar al disco. */
export function guardar(){
  clearTimeout(reloj);
  reloj = setTimeout(guardarYa, 350);
}

export async function guardarYa(){
  clearTimeout(reloj);
  if (modo === 'servidor'){
    if (enVuelo) { guardar(); return; }     // ya hay una escritura andando
    enVuelo = true;
    try{
      const r = await fetch(RUTAS.api, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      if (!r.ok) throw new Error(r.status);
      marcarGuardado();
    }catch(e){
      avisar('No se pudo guardar en el servidor', true);
    }finally{ enVuelo = false; }
    return;
  }

  try{
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(datos));
    marcarGuardado();
  }catch(e){
    avisar('No se pudo guardar en este dispositivo', true);
  }
}

let ultimoGuardado = null;
function marcarGuardado(){
  ultimoGuardado = new Date();
  document.dispatchEvent(new CustomEvent('base:guardada'));
}
export const cuandoSeGuardo = () => ultimoGuardado;

/* ---- reemplazo completo ------------------------------------------------ */

export function reemplazar(nueva){
  datos = normalizar(nueva);
  return guardarYa();
}

export async function volverAlInicial(){
  const r = await fetch(RUTAS.inicial);
  if (!r.ok) throw new Error('no se pudo leer la base inicial');
  return reemplazar(await r.json());
}

export function vaciar(){
  return reemplazar(VACIA());
}

/* Lo que se descarga desde Ajustes y lo que se sube al repositorio. */
export function comoJSON(){
  return JSON.stringify(
    Object.assign({}, datos, { generado: new Date().toISOString() }), null, 2);
}
