/* --------------------------------------------------------------------------
   TEMA CLARO Y OSCURO

   La marca tiene dos versiones, negro sobre blanco y blanco sobre negro, así
   que la aplicación tiene dos temas. Todo el cambio ocurre en las variables
   CSS: acá solo se decide cuál está puesto y se recuerda la elección.

   El tema se aplica en un script de la cabecera, antes de que se pinte nada.
   Este módulo carga después y solo se ocupa de los botones. Si esperara a
   cargar para aplicarlo, se vería un destello blanco antes de pasar a oscuro.
   -------------------------------------------------------------------------- */

const CLAVE = 'indumentaria.tema';
const COLOR_BARRA = { claro: '#F1F1EF', oscuro: '#0E0E0E' };

export const temaActual = () =>
  document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro';

export function aplicarTema(tema){
  const t = tema === 'oscuro' ? 'oscuro' : 'claro';
  document.documentElement.dataset.tema = t;

  /* La barra del navegador en el celular también acompaña. */
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = COLOR_BARRA[t];

  try{ localStorage.setItem(CLAVE, t); }catch(e){}
  document.dispatchEvent(new CustomEvent('tema:cambiado', { detail: t }));
  return t;
}

export const alternarTema = () =>
  aplicarTema(temaActual() === 'oscuro' ? 'claro' : 'oscuro');

/* Si la persona nunca eligió, se sigue al sistema, incluso si cambia mientras
   la aplicación está abierta. En cuanto elige a mano, manda su elección. */
export function seguirAlSistema(){
  let eligio = false;
  try{ eligio = !!localStorage.getItem(CLAVE); }catch(e){}
  if (eligio) return;

  /* window.matchMedia explícito y con guarda: algunos navegadores embebidos
     no lo traen, y sin esto la aplicación no arrancaría por un detalle
     cosmético. */
  const consulta = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  if (!consulta) return;
  const escuchar = e => {
    let yaEligio = false;
    try{ yaEligio = !!localStorage.getItem(CLAVE); }catch(e2){}
    if (yaEligio) return;
    document.documentElement.dataset.tema = e.matches ? 'oscuro' : 'claro';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = COLOR_BARRA[e.matches ? 'oscuro' : 'claro'];
  };
  if (consulta.addEventListener) consulta.addEventListener('change', escuchar);
}
