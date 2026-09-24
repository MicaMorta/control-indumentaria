/* --------------------------------------------------------------------------
   INGRESO — versión de prototipo

   ADVERTENCIA, y no es una formalidad: esto NO es seguridad.

   datos/usuarios.json es un archivo público del sitio. Cualquiera que ponga
   la URL lo descarga. La contraseña está guardada como hash SHA-256, así que
   no se lee de un vistazo, pero la comparación ocurre en el navegador de quien
   entra: con la consola abierta se puede saltear en diez segundos.

   Sirve para que el local no quede abierto a cualquiera que pase, y nada más.
   La versión de producción usa Firebase Authentication, donde la contraseña se
   valida del lado del servidor y los datos quedan detrás de Security Rules.
   -------------------------------------------------------------------------- */

import { RUTAS, CLAVE_SESION } from './config.js';

let usuarios = null;

async function cargarUsuarios(){
  if (usuarios) return usuarios;
  const r = await fetch(RUTAS.usuarios);
  if (!r.ok) throw new Error('No se pudo leer ' + RUTAS.usuarios);
  const j = await r.json();
  usuarios = j.usuarios || [];
  return usuarios;
}

export async function hash(texto){
  /* crypto.subtle solo existe en contextos seguros: https o localhost. Si el
     archivo se abrió con doble clic (file://) no está, y ahí entra el respaldo
     de abajo, que da exactamente el mismo resultado. */
  if (crypto?.subtle){
    const bytes = new TextEncoder().encode(texto);
    const resumen = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(resumen))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256(texto);
}

/* --------------------------------------------------------------------------
   SHA-256 en JavaScript puro (FIPS 180-4). Solo se usa como respaldo.
   -------------------------------------------------------------------------- */
const K = [
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
];

function sha256(texto){
  const gd = (x, n) => (x >>> n) | (x << (32 - n));
  const bytes = new TextEncoder().encode(texto);
  const bits = bytes.length * 8;

  /* relleno: un 1, ceros, y la longitud en 64 bits al final */
  const largo = (((bytes.length + 8) >> 6) + 1) << 4;   // en palabras de 32 bits
  const m = new Uint32Array(largo);
  for (let i = 0; i < bytes.length; i++) m[i >> 2] |= bytes[i] << (24 - (i % 4) * 8);
  m[bytes.length >> 2] |= 0x80 << (24 - (bytes.length % 4) * 8);
  m[largo - 1] = bits;

  let [h0,h1,h2,h3,h4,h5,h6,h7] =
    [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];

  const w = new Uint32Array(64);
  for (let i = 0; i < largo; i += 16){
    for (let t = 0; t < 16; t++) w[t] = m[i + t];
    for (let t = 16; t < 64; t++){
      const s0 = gd(w[t-15], 7) ^ gd(w[t-15], 18) ^ (w[t-15] >>> 3);
      const s1 = gd(w[t-2], 17) ^ gd(w[t-2], 19) ^ (w[t-2] >>> 10);
      w[t] = (w[t-16] + s0 + w[t-7] + s1) | 0;
    }
    let [a,b,c,d,e,f,g,h] = [h0,h1,h2,h3,h4,h5,h6,h7];
    for (let t = 0; t < 64; t++){
      const S1 = gd(e, 6) ^ gd(e, 11) ^ gd(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[t] + w[t]) | 0;
      const S0 = gd(a, 2) ^ gd(a, 13) ^ gd(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0+a)|0; h1 = (h1+b)|0; h2 = (h2+c)|0; h3 = (h3+d)|0;
    h4 = (h4+e)|0; h5 = (h5+f)|0; h6 = (h6+g)|0; h7 = (h7+h)|0;
  }

  return [h0,h1,h2,h3,h4,h5,h6,h7]
    .map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

export async function verificar(usuario, clave){
  const lista = await cargarUsuarios();
  const u = lista.find(x => x.usuario.toLowerCase() === String(usuario).trim().toLowerCase());
  if (!u) return null;
  const h = await hash(clave);
  return h === u.clave ? { usuario: u.usuario, nombre: u.nombre || u.usuario } : null;
}

export function recordarSesion(u){
  try{ sessionStorage.setItem(CLAVE_SESION, JSON.stringify(u)); }catch(e){}
}

export function sesionActiva(){
  try{
    const c = sessionStorage.getItem(CLAVE_SESION);
    return c ? JSON.parse(c) : null;
  }catch(e){ return null; }
}

export function cerrarSesion(){
  try{ sessionStorage.removeItem(CLAVE_SESION); }catch(e){}
}
