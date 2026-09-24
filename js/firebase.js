/* --------------------------------------------------------------------------
   CONEXIÓN CON FIREBASE

   El SDK se carga desde la CDN de Google y solo si hay credenciales en
   datos/firebase.json. Si el archivo no está, si la red falla o si el entorno
   bloquea la carga, `disponible()` devuelve false y el resto del programa
   sigue funcionando contra el servidor local o contra el navegador.

   Esa degradación no es un adorno: permite desarrollar sin tocar la base real
   del negocio, y permite que la demostración de un solo archivo siga andando.
   -------------------------------------------------------------------------- */

import { RUTAS, SDK } from './config.js';

let estado = 'sin-iniciar';   // sin-iniciar | listo | ausente
let app = null, auth = null, db = null, api = null, config = null;

export async function iniciarFirebase(){
  if (estado !== 'sin-iniciar') return estado === 'listo';

  try{
    const r = await fetch(RUTAS.firebase);
    if (!r.ok) throw new Error('sin credenciales');
    config = await r.json();
    if (!config.projectId || !config.apiKey) throw new Error('credenciales incompletas');

    /* Punto de inyección para las pruebas: si hay un SDK puesto acá, se usa
       ese en lugar de bajar el de Google. En el navegador nunca existe, así
       que el camino normal no cambia. Es la única forma de probar el ingreso
       y la sincronización sin pegarle a un proyecto real. */
    const [apps, autenticacion, firestore] = globalThis.__SDK_FIREBASE
      ? [globalThis.__SDK_FIREBASE.apps,
         globalThis.__SDK_FIREBASE.auth,
         globalThis.__SDK_FIREBASE.db]
      : await Promise.all([
          import(`${SDK}/firebase-app.js`),
          import(`${SDK}/firebase-auth.js`),
          import(`${SDK}/firebase-firestore.js`)
        ]);

    app  = apps.initializeApp(config);
    auth = autenticacion.getAuth(app);
    db   = firestore.getFirestore(app);

    /* La caché en disco evita volver a cobrar lecturas por lo mismo y deja la
       aplicación utilizable con la conexión intermitente del local. */
    try{
      await firestore.enableIndexedDbPersistence(db);
    }catch(e){
      /* Falla si hay otra pestaña abierta o el navegador no lo soporta.
         Sin caché anda igual, solo consume más lecturas. */
    }

    api = { apps, auth: autenticacion, db: firestore };
    estado = 'listo';
    return true;

  }catch(e){
    estado = 'ausente';
    return false;
  }
}

export const disponible = () => estado === 'listo';
export const conexion   = () => ({ app, auth, db, api, config });

/* Segunda instancia de la aplicación, con su propia sesión.
   Sirve para dar de alta un usuario sin perder la sesión del administrador:
   createUserWithEmailAndPassword inicia sesión con la cuenta recién creada,
   así que hecho sobre la instancia principal echaría a quien lo está usando. */
export function instanciaAparte(nombre = 'alta'){
  if (!disponible()) return null;
  const existente = api.apps.getApps().find(a => a.name === nombre);
  const segunda = existente || api.apps.initializeApp(config, nombre);
  return { app: segunda, auth: api.auth.getAuth(segunda) };
}

export async function cerrarInstanciaAparte(nombre = 'alta'){
  if (!disponible()) return;
  const existente = api.apps.getApps().find(a => a.name === nombre);
  if (existente) await api.apps.deleteApp(existente);
}
