/* Logo, favicon y conmutación de tema.
   Requiere jsdom:  npm install --no-save jsdom
   Uso:            node herramientas/prueba-marca.mjs */
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errores=[];
const dom=new JSDOM(await readFile(RAIZ+'/index.html','utf8'),
  {url:'https://local.test/',virtualConsole:new VirtualConsole(),runScripts:'dangerously'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,
  localStorage:dom.window.localStorage,sessionStorage:dom.window.sessionStorage,
  CustomEvent:dom.window.CustomEvent,Event:dom.window.Event});
globalThis.fetch=async u=>{const k=String(u).replace(/^https?:\/\/[^/]+\//,'').replace(/^\.?\//,'');
  if(k==='datos/firebase.json'||k==='api/base') return new Response('',{status:404});
  try{return new Response(await readFile(RAIZ+'/'+k,'utf8'),{status:200})}catch{return new Response('',{status:404})}};
const tema=await import(RAIZ+'/js/tema.js');
await import(RAIZ+'/js/app.js');
await new Promise(r=>setTimeout(r,400));
const d=document;
const paso=(n,f)=>{try{f();console.log('  ok  '+n)}catch(e){console.log('  MAL '+n+' → '+e.message);errores.push(n)}};

console.log('== marca ==');
paso('el logo está en el acceso y en la barra lateral', ()=>{
  if(!d.querySelector('#ingreso .marca-logo')) throw new Error('falta en el acceso');
  if(!d.querySelector('.rail-tope .marca-logo')) throw new Error('falta en la barra lateral');
});
paso('el de la barra está encima de "Control de stock"', ()=>{
  const tope=d.querySelector('.rail-tope');
  const hijos=[...tope.children];
  if(hijos.indexOf(tope.querySelector('.marca-logo')) > hijos.indexOf(tope.querySelector('h2')))
    throw new Error('quedó debajo del título');
});
paso('cada logo trae sus dos versiones', ()=>{
  d.querySelectorAll('.marca-logo').forEach(m=>{
    if(!m.querySelector('.logo-claro')) throw new Error('sin versión negra');
    if(!m.querySelector('.logo-oscuro')) throw new Error('sin versión blanca');
  });
});
paso('los SVG tienen viewBox, si no no escalan', ()=>{
  d.querySelectorAll('.logo').forEach(l=>{
    if(!l.getAttribute('viewBox')) throw new Error('sin viewBox');
  });
});
paso('favicon MS declarado', ()=>{
  const i=d.querySelector('link[rel="icon"]');
  if(!i) throw new Error('sin favicon');
  if(!i.href.includes('favicon.svg')) throw new Error('href: '+i.href);
  if(i.type!=='image/svg+xml') throw new Error('type: '+i.type);
});

console.log('== tema ==');
paso('arranca en claro por defecto', ()=>{
  if(tema.temaActual()!=='claro') throw new Error('arrancó en '+tema.temaActual());
});
paso('el botón alterna a oscuro', ()=>{
  d.getElementById('cambiar-tema').click();
  if(d.documentElement.dataset.tema!=='oscuro') throw new Error('no cambió');
});
paso('y vuelve a claro', ()=>{
  d.getElementById('cambiar-tema').click();
  if(d.documentElement.dataset.tema!=='claro') throw new Error('no volvió');
});
paso('el botón de la barra lateral también', ()=>{
  d.getElementById('cambiar-tema-2').click();
  if(d.documentElement.dataset.tema!=='oscuro') throw new Error('no cambió');
});
paso('queda recordado', ()=>{
  if(localStorage.getItem('indumentaria.tema')!=='oscuro') throw new Error('no lo guardó');
});
paso('la barra del navegador acompaña', ()=>{
  const m=d.querySelector('meta[name="theme-color"]');
  if(m.content!=='#0E0E0E') throw new Error('theme-color: '+m.content);
  tema.aplicarTema('claro');
  if(m.content!=='#F1F1EF') throw new Error('no volvió: '+m.content);
});
paso('avisa el cambio a quien escuche', ()=>{
  let visto=null;
  d.addEventListener('tema:cambiado', e=>visto=e.detail);
  tema.alternarTema();
  if(visto!=='oscuro') throw new Error('no avisó');
  tema.aplicarTema('claro');
});

console.log('== paleta ==');
paso('no quedan colores del tema anterior', async()=>{});
{
  const css=await readFile(RAIZ+'/css/estilos.css','utf8');
  paso('sin verdes ni ciruelas sueltos del tema viejo', ()=>{
    const viejos=['#0F6E6A','#0A4F4C','#E2EFED','#8E2F5B','#F6E8EE','#B07A0C'];
    const quedan=viejos.filter(c=>css.includes(c));
    if(quedan.length) throw new Error('quedaron: '+quedan.join(', '));
  });
  paso('el tema oscuro define todas las variables del claro', ()=>{
    const claro=[...css.matchAll(/^\s*(--[a-z0-9-]+):/gmi)].map(m=>m[1]);
    const bloqueOscuro=css.slice(css.indexOf('[data-tema="oscuro"]'), css.indexOf('html{ scroll-padding'));
    const faltan=[...new Set(claro)].filter(v=>
      !['--r-ch','--r','--r-gr','--rail'].includes(v) && !bloqueOscuro.includes(v+':'));
    if(faltan.length) throw new Error('sin variante oscura: '+faltan.join(', '));
  });
}

console.log('\n'+(errores.length?'FALLOS: '+errores.join(', '):'sin errores'));
process.exit(errores.length?1:0);
