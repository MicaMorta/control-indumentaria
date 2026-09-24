# Qué hay en el repositorio

Resumen de para qué sirve cada cosa, y qué revisar antes de entregarle una
instalación a un cliente.

---

## Lo que se publica en el sitio

Esto lo descarga el navegador. Es lo único que tiene que llegar al hosting.

```
index.html              La página
css/estilos.css         Estilos. La paleta está en :root, arriba de todo
js/                     El programa
datos/firebase.json     Credenciales del proyecto del cliente
datos/usuarios.json     Solo para el modo prototipo (ver abajo)
datos/inicial.json      Datos de muestra (ver abajo)
```

## Lo que vive solo en el repositorio

No lo descarga nadie, no pesa en el sitio y no hace falta sacarlo.

```
herramientas/           Pruebas y utilidades
servidor/servidor.mjs   Servidor local para desarrollar
firestore.rules         Reglas de seguridad. Se publican con firebase deploy
*.md                    Documentación
package.json            Atajos de npm
```

Las pruebas encontraron, entre otras cosas: dos nombres que chocaban al armar
el archivo único, importaciones con alias que quedaban rotas, un borrado que
se habría llevado todo el historial anterior a noventa días, y el redondeo que
hacía que un rango de un día contara dos. Sacarlas para que el repositorio se
vea prolijo sale carísimo la primera vez que algo se rompe.

---

## Antes de entregar

### 1. Modo estricto

En `js/config.js`:

```javascript
export const MODO_ESTRICTO = true;
```

Con esto, si Firebase no responde, la aplicación no deja entrar y dice por qué.

En `false` —el valor de desarrollo— caería sola al modo prototipo: validaría
contra `datos/usuarios.json` y guardaría en el navegador. La persona vería un
sistema que aparentemente anda, cargando ventas en un lugar que no es la base
del negocio. Es la peor forma de fallar.

### 2. Datos de muestra

`datos/inicial.json` tiene productos y ventas inventados. Con la base en la
nube no se usa, y el botón de volver a la demostración no aparece. Podés
dejarlo o vaciarlo; no molesta.

### 3. El usuario de prototipo

`datos/usuarios.json` tiene el usuario `mica` con un PIN de prueba. Con modo
estricto en `true` no se lee nunca. Si querés, reemplazalo por:

```json
{ "usuarios": [] }
```

### 4. Reglas publicadas

```bash
firebase deploy --only firestore:rules
```

Comprobalo: en una ventana de incógnito, sin iniciar sesión, la consola del
navegador tiene que devolver `permission-denied` al intentar leer una
colección.

### 5. App Check

Es lo que cierra el camino de probar las 10.000 combinaciones de un PIN de
cuatro dígitos contra la API desde afuera. Está en el paso 8 de `FIREBASE.md`.

### 6. Que todo pase

```bash
npm install --no-save jsdom
npm run prueba
```

---

## Dos botones que cambian cuando hay base en la nube

**Volver a la demostración** desaparece. Con la base local reemplazaba datos de
juguete por datos de juguete; con la base real reemplazaría el negocio por
productos inventados, para todos los dispositivos.

**Vaciar todo** pide escribir la palabra BORRAR y avisa cuántos productos,
ventas y pedidos se van a perder. Un botón de confirmar se toca sin leer; una
palabra hay que escribirla.

---

## Varios clientes, un solo código

Lo mismo para todos, y lo que cambia por cliente son tres cosas:
`datos/firebase.json`, la paleta en `:root` y los interruptores de
`js/config.js`.

Cuando aparezcan funciones para un cliente puntual —fotos de producto, lector
de código de barras—, van como módulos con un interruptor en `config.js`, no
como una copia del proyecto. Cuatro copias divergentes significan aplicar cada
arreglo cuatro veces.
