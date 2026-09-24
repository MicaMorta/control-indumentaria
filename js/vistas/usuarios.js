/* --------------------------------------------------------------------------
   USUARIOS — página oculta

   No está en el menú: se llega escribiendo #usuarios en la dirección.

   Que no aparezca en el menú es comodidad, no seguridad. Lo que realmente
   protege esta pantalla es doble: el rol `admin` en el documento del usuario,
   y las Security Rules, que solo dejan escribir en la colección `usuarios` a
   quien tenga ese rol. Una dirección que nadie conoce es la llave abajo del
   felpudo; esto es una cerradura.
   -------------------------------------------------------------------------- */

import { $, esc, fechaLarga, avisar, confirmar } from '../utilidades.js';
import { crearUsuario, listarUsuarios, cambiarMiPin, esAdmin, sesionActiva,
         normalizarUsuario, pinValido } from '../auth.js';
import { disponible, porQueNo, codigoDeFalla, detalleDeFalla } from '../firebase.js';
import { LARGO_PIN } from '../config.js';
import { bus } from '../estado.js';

let lista = [];

export async function vistaUsuarios(){
  $('#acciones').innerHTML = '<button class="btn" data-ir="panel">Volver</button>';

  if (!disponible()){
    $('#hoja').innerHTML = `<section class="tarjeta">
      <div class="tarjeta-tope"><h3>Sin conexión con Firebase</h3></div>
      <div class="tarjeta-cuerpo">
        <p class="error-caja" style="margin-bottom:14px">${esc(porQueNo())}</p>
        <p style="font-size:13.5px;color:var(--tinta-2);margin:0 0 12px;line-height:1.6">
          Entraste igual porque la aplicación cayó al modo prototipo, que valida contra
          <code>datos/usuarios.json</code>. En ese modo no hay usuarios que administrar:
          ese archivo se edita a mano.</p>
        <details style="font-size:13.5px;color:var(--tinta-2);line-height:1.6">
          <summary style="cursor:pointer;font-weight:500;color:var(--tinta)">
            Cómo verificarlo</summary>
          <ol style="margin:10px 0 0;padding-left:20px">
            <li>Abrí <code>${esc(window.location.origin)}/datos/firebase.json</code> en una pestaña.
                Si da 404, el archivo no está donde la aplicación lo busca.</li>
            <li>Si lo estás sirviendo desde GitHub Pages, fijate que
                <code>datos/firebase.json</code> figura en <code>.gitignore</code>:
                hay que sacarlo de ahí para que se publique.</li>
            <li>Si abriste el archivo con doble clic, no va a funcionar nunca.
                Hace falta <code>http://localhost</code> o <code>https</code>.</li>
            <li>Revisá la consola del navegador por errores de red bloqueada.</li>
          </ol>
          <div class="diagnostico">
            <div><span>Código</span><code>${esc(codigoDeFalla() || 'desconocido')}</code></div>
            <div><span>Dirección pedida</span>
              <code>${esc((detalleDeFalla() || {}).direccion || '—')}</code></div>
            <div><span>Respondió</span>
              <code>${esc(String((detalleDeFalla() || {}).estado ?? 'no respondió'))}</code></div>
            <div><span>Primeros caracteres</span>
              <code>${esc((detalleDeFalla() || {}).vino || '—')}</code></div>
          </div>
        </details>
      </div>
    </section>`;
    return;
  }

  if (!esAdmin()){
    /* Sin rol de administrador no se muestra ni el formulario. Aunque alguien
       lo forzara, las Security Rules rechazan la escritura. */
    $('#hoja').innerHTML = `<section class="tarjeta"><div class="vacio">
      <h3>No tenés permiso</h3>
      <p>Esta pantalla es para administradores.</p>
    </div></section>`;
    return;
  }

  $('#hoja').innerHTML = `
    <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(330px,1fr))">
      <section class="tarjeta">
        <div class="tarjeta-tope"><h3>Crear usuario</h3></div>
        <div class="tarjeta-cuerpo">
          <div style="display:grid;gap:13px">
            <label class="campo"><span>Nombre de usuario</span>
              <input type="text" id="u-usuario" autocapitalize="off" spellcheck="false"
                placeholder="mica"></label>
            <label class="campo"><span>Nombre para mostrar</span>
              <input type="text" id="u-nombre" placeholder="Mica"></label>
            <label class="campo"><span>PIN de ${LARGO_PIN} números</span>
              <input type="password" id="u-pin" inputmode="numeric"
                maxlength="${LARGO_PIN}" autocomplete="new-password"></label>
            <label class="campo"><span>Permisos</span>
              <select id="u-rol">
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
              </select></label>
            <p id="u-error" hidden class="error-caja"></p>
            <button class="btn primario" id="u-crear">Crear usuario</button>
          </div>
          <p class="firma" style="margin-top:14px">
            Un vendedor usa el sistema. Un administrador además entra acá y crea
            usuarios.</p>
        </div>
      </section>

      <section class="tarjeta">
        <div class="tarjeta-tope"><h3>Usuarios</h3></div>
        <div id="u-lista"><div class="vacio" style="padding:28px">Cargando…</div></div>
      </section>

      <section class="tarjeta">
        <div class="tarjeta-tope"><h3>Cambiar mi PIN</h3></div>
        <div class="tarjeta-cuerpo">
          <div style="display:grid;gap:13px">
            <label class="campo"><span>PIN actual</span>
              <input type="password" id="u-pin-viejo" inputmode="numeric"
                maxlength="${LARGO_PIN}" autocomplete="current-password"></label>
            <label class="campo"><span>PIN nuevo</span>
              <input type="password" id="u-pin-nuevo" inputmode="numeric"
                maxlength="${LARGO_PIN}" autocomplete="new-password"></label>
            <button class="btn" id="u-cambiar">Cambiar PIN</button>
          </div>
        </div>
      </section>
    </div>`;

  $('#u-crear').onclick = alta;
  $('#u-cambiar').onclick = cambiarPin;
  await pintarLista();
}

async function pintarLista(){
  lista = await listarUsuarios();
  const cont = $('#u-lista');
  if (!cont) return;

  cont.innerHTML = lista.length ? `
    <div class="tabla-env"><table>
      <thead><tr><th>Usuario</th><th>Nombre</th><th>Permisos</th><th>Creado</th></tr></thead>
      <tbody>${lista.map(u => `
        <tr>
          <td class="prod-nombre">${esc(u.usuario)}
            ${sesionActiva() && u.uid === sesionActiva().uid
              ? '<span class="pastilla" style="margin-left:7px">vos</span>' : ''}</td>
          <td>${esc(u.nombre || '')}</td>
          <td><span class="pastilla ${u.rol === 'admin' ? 'es-ingreso' : ''}">
            ${u.rol === 'admin' ? 'Administrador' : 'Vendedor'}</span></td>
          <td style="color:var(--tinta-3);font-size:13px">
            ${u.creadoEl ? fechaLarga.format(new Date(u.creadoEl)) : '—'}
            ${u.creadoPor ? `<br>por ${esc(u.creadoPor)}` : ''}</td>
        </tr>`).join('')}</tbody>
    </table></div>`
    : '<div class="vacio" style="padding:28px">Todavía no hay usuarios cargados.</div>';
}

function mostrarError(texto){
  const el = $('#u-error');
  if (!el) return;
  el.textContent = texto;
  el.hidden = !texto;
}

async function alta(){
  const usuario = $('#u-usuario').value;
  const pin = $('#u-pin').value;
  mostrarError('');

  if (!normalizarUsuario(usuario)){ mostrarError('Escribí un nombre de usuario.'); return; }
  if (!pinValido(pin)){ mostrarError(`El PIN son ${LARGO_PIN} números.`); return; }

  const btn = $('#u-crear');
  btn.disabled = true;
  btn.textContent = 'Creando…';

  const r = await crearUsuario({
    usuario,
    nombre: $('#u-nombre').value,
    pin,
    rol: $('#u-rol').value
  });

  btn.disabled = false;
  btn.textContent = 'Crear usuario';

  if (r.error){ mostrarError(r.error); return; }

  $('#u-usuario').value = '';
  $('#u-nombre').value = '';
  $('#u-pin').value = '';
  avisar('Usuario creado');
  await pintarLista();
}

async function cambiarPin(){
  const viejo = $('#u-pin-viejo').value;
  const nuevo = $('#u-pin-nuevo').value;

  if (!pinValido(nuevo)){ avisar(`El PIN nuevo son ${LARGO_PIN} números.`, true); return; }

  confirmar({
    titulo: 'Cambiar tu PIN',
    texto: 'A partir de ahora vas a entrar con el PIN nuevo. Anotalo antes de confirmar.',
    botón: 'Cambiar',
    async alConfirmar(){
      const r = await cambiarMiPin(viejo, nuevo);
      if (r.error){ avisar(r.error, true); return; }
      $('#u-pin-viejo').value = '';
      $('#u-pin-nuevo').value = '';
      avisar('PIN cambiado');
    }
  });
}
