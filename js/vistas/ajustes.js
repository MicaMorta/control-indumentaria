import { $, esc, dia, hoyISO, bajar, avisar, confirmar } from '../utilidades.js';
import { datos, modo, guardar, comoJSON, reemplazar, volverAlInicial, vaciar }
  from '../almacen.js';
import { productosEnAlerta } from '../negocio.js';
import { ui, bus } from '../estado.js';

export function vistaAjustes(){
  $('#acciones').innerHTML = '';

  const enNube     = modo === 'firestore';
  const enServidor = modo === 'servidor';

  $('#hoja').innerHTML = `
    <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(310px,1fr))">

      <section class="tarjeta">
        <div class="tarjeta-tope"><h3>Dónde se están guardando los datos</h3></div>
        <div class="tarjeta-cuerpo">
          <p style="margin:0 0 11px;font-size:14px">
            <span class="pastilla ${enNube || enServidor ? 'es-ingreso' : 'es-egreso'}">
              ${enNube ? 'En la nube' : enServidor ? 'En el archivo JSON' : 'En este navegador'}</span>
          </p>
          <p style="font-size:13.5px;color:var(--tinta-2);margin:0;line-height:1.6">
            ${enNube
              ? `Los datos están en Firestore, detrás de tu usuario. Se ven desde
                 cualquier dispositivo y Google los respalda. Para no gastar la cuota
                 de lecturas, al abrir se traen los últimos meses; si un informe pide
                 fechas más viejas, ese tramo se busca en el momento.`
              : enServidor
              ? `Hay un servidor escuchando, así que cada cambio se escribe en
                 <code>datos/base.json</code>. Es el archivo que subís al repositorio.`
              : `No hay servidor, así que todo vive en el almacenamiento de este navegador.
                 Descargá el respaldo y reemplazá <code>datos/inicial.json</code> en el
                 repositorio para conservar los cambios.`}
          </p>
        </div>
      </section>

      <section class="tarjeta">
        <div class="tarjeta-tope"><h3>Aviso de stock bajo</h3></div>
        <div class="tarjeta-cuerpo">
          <label class="campo"><span>Avisame cuando un talle quede en esta cantidad o menos</span>
            <input type="number" id="a-umbral" value="${datos.umbral}" min="0" max="50"></label>
          <label class="campo" style="margin-top:12px">
            <span>Al sugerir un pedido, reponer hasta esta cantidad por talle</span>
            <input type="number" id="a-reponer" value="${datos.reponerHasta}" min="1" max="200"></label>
          <p style="font-size:13px;color:var(--tinta-2);margin:10px 0 0">
            Ahora hay ${productosEnAlerta().length} productos con algún talle por reponer.
            El sistema sabe qué reponer mirando el stock; cuánto pedir sale de este número.</p>
        </div>
      </section>

      <section class="tarjeta">
        <div class="tarjeta-tope"><h3>Respaldo</h3></div>
        <div class="tarjeta-cuerpo">
          <p style="font-size:13.5px;color:var(--tinta-2);margin:0 0 13px">
            Copia completa de productos, ventas y movimientos, en el mismo formato
            que lee el programa. Guardala en el drive o en el mail una vez por semana.</p>
          <div style="display:flex;gap:9px;flex-wrap:wrap">
            <button class="btn primario" id="a-exportar">Descargar respaldo</button>
            <button class="btn" id="a-importar">Restaurar desde archivo</button>
          </div>
        </div>
      </section>

      <section class="tarjeta">
        <div class="tarjeta-tope"><h3>Datos de demostración</h3></div>
        <div class="tarjeta-cuerpo">
          <p style="font-size:13.5px;color:var(--tinta-2);margin:0 0 13px">
            El programa arranca con productos y ventas inventados para mostrar cómo se ve
            en uso. Vaciá todo cuando quieras empezar con el stock real.</p>
          <div style="display:flex;gap:9px;flex-wrap:wrap">
            <button class="btn" id="a-resembrar">Volver a la demostración</button>
            <button class="btn riesgo" id="a-vaciar">Vaciar todo</button>
          </div>
        </div>
      </section>

      <section class="tarjeta">
        <div class="tarjeta-tope"><h3>Qué falta para la versión final</h3></div>
        <div class="tarjeta-cuerpo" style="font-size:13.5px;color:var(--tinta-2);line-height:1.65">
          ${enNube
            ? `<p style="margin:0 0 9px">El ingreso se valida contra el servidor y los datos
               quedan detrás de las Security Rules.</p>
               <p style="margin:0">Falta el cierre de caja diario, y definir si hace falta
               lectura de código de barras y fotos de producto.</p>`
            : `<p style="margin:0 0 9px">El ingreso de hoy se valida en el propio navegador
               contra un archivo público: alcanza para que no entre cualquiera, pero no es
               seguridad real.</p>
               <p style="margin:0">Configurando <code>datos/firebase.json</code> pasa a
               Firestore con autenticación real, acceso desde cualquier dispositivo y
               respaldo automático.</p>`}
        </div>
      </section>
    </div>`;

  $('#a-umbral').onchange = e => {
    datos.umbral = Math.max(0, parseInt(e.target.value) || 0);
    guardar(); bus.pintar(); avisar('Aviso actualizado');
  };

  $('#a-reponer').onchange = e => {
    datos.reponerHasta = Math.max(1, parseInt(e.target.value) || 1);
    guardar(); avisar('Cantidad sugerida actualizada');
  };

  $('#a-exportar').onclick = () => {
    bajar(`base-${dia(hoyISO())}.json`, comoJSON(), 'application/json');
    avisar('Respaldo descargado');
  };

  $('#a-importar').onclick = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      const lector = new FileReader();
      lector.onload = async () => {
        try{
          const d = JSON.parse(lector.result);
          if (!Array.isArray(d.productos)) throw new Error('formato');
          await reemplazar(d);
          ui.carrito = [];
          bus.pintar();
          avisar('Respaldo restaurado');
        }catch(e){
          avisar('El archivo no tiene el formato del respaldo', true);
        }
      };
      lector.readAsText(f);
    };
    inp.click();
  };

  $('#a-resembrar').onclick = () => confirmar({
    titulo: 'Volver a la demostración',
    texto: 'Se reemplaza todo lo que haya cargado por los datos de muestra. Descargá un respaldo antes si te importa lo que hay.',
    botón: 'Reemplazar',
    riesgo: true,
    async alConfirmar(){
      try{
        await volverAlInicial();
        ui.carrito = [];
        bus.pintar();
        avisar('Demostración recargada');
      }catch(e){
        avisar('No se pudo leer datos/inicial.json', true);
      }
    }
  });

  $('#a-vaciar').onclick = () => confirmar({
    titulo: 'Vaciar todo',
    texto: 'Se borran los productos, las ventas y los movimientos. Si todavía no descargaste un respaldo, esto no se puede deshacer.',
    botón: 'Vaciar todo',
    riesgo: true,
    async alConfirmar(){
      await vaciar();
      ui.carrito = [];
      bus.ir('productos');
      avisar('Todo vacío');
    }
  });
}
