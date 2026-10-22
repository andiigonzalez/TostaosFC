# Web de Tostaos F.C.

Web estática para GitHub Pages. El míster rellena **un solo Google Form** después de cada partido y la web se actualiza sola: la crónica, el once titular, las notas, el historial de cada jugador, las estadísticas de la temporada y el banner del próximo partido con su estrategia.

```
index.html               la página
css/styles.css           el diseño
js/config.js             ← lo ÚNICO que hay que configurar
js/app.js                la lógica (no hace falta tocarla)
img/escudo.svg           el escudo de las máscaras
data/plantilla.json      ← jugadores (nombre, dorsal, posición, pie, descripción, foto)
data/calendario.json     ← partidos de la temporada
data/ejemplo.csv         datos de prueba para ver cómo queda
google/crear-formulario.gs   script que crea el formulario y la hoja
.nojekyll                necesario para GitHub Pages
```

---

## Paso 1 · Subir la web a GitHub Pages

1. Entra en github.com y crea un repositorio nuevo, por ejemplo `tostaos`, **público**.
2. Pulsa **Add file › Upload files** y arrastra **todo el contenido** de esta carpeta (no la carpeta en sí: `index.html` tiene que quedar en la raíz). Pulsa **Commit changes**.
   - El archivo `.nojekyll` está oculto en algunos ordenadores. Si no se sube, créalo en GitHub con **Add file › Create new file**, nombre `.nojekyll`, vacío.
3. Ve a **Settings › Pages**. En *Source* elige **Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guarda.
4. En un par de minutos la web estará en `https://TU-USUARIO.github.io/tostaos/`. De momento muestra los datos de ejemplo.

## Paso 2 · Crear el formulario (una sola vez)

1. Con la cuenta de Google que vaya a usar el equipo, entra en **script.google.com › Nuevo proyecto**.
2. Borra lo que haya, pega todo el contenido de `google/crear-formulario.gs` y guarda.
3. Arriba elige la función **crearFormulario** y pulsa **Ejecutar**. Acepta los permisos que pide Google: el script es tuyo y solo crea un formulario y una hoja.
4. Abre **Registro de ejecución**. Ahí tienes:
   - el **enlace del formulario**, para mandárselo a Beltrán;
   - el **enlace de la hoja de respuestas**.

El formulario tiene 4 secciones: el partido, la alineación, el rendimiento de cada jugador (nota, goles, asistencias, tarjetas, MVP y comentarios) y el próximo partido con la estrategia.

> No cambies los títulos de las preguntas: la web las reconoce por su nombre.

## Paso 3 · Conectar la hoja con la web

1. Abre la hoja de respuestas › **Archivo › Compartir › Publicar en la Web**.
2. En el primer desplegable elige la pestaña de respuestas (*Respuestas de formulario 1*). En el segundo, **Valores separados por comas (.csv)**. Pulsa **Publicar** y copia el enlace.
3. En GitHub abre `js/config.js`, pulsa el lápiz (editar) y:
   - pega el enlace en `urlRespuestasCSV: "…"`;
   - cambia `usarEjemplo: true` por `usarEjemplo: false`;
   - rellena `liga`, `ciudad` y `lema`.
4. **Commit changes.** Listo.

Google tarda unos **5 minutos** en reflejar una respuesta nueva en el enlace publicado.

---

## Uso semanal (el míster)

- Rellena el formulario después del partido.
- **Momentos clave:** uno por línea, `minuto - tipo - descripción` (tipos: Gol, Ocasión, Tarjeta, Cambio).
- **MVP y Peor del partido:** salen en la web como dos tarjetas de *rasca y gana* (en Inicio y en cada crónica). Cada visitante las rasca una vez; su navegador recuerda que ya las ha rascado.
- **Comentarios por jugador:** uno por línea, `Nombre: comentario`.
- **¿Se ha equivocado?** Que lo vuelva a enviar con el **mismo número de jornada**: la web usa siempre el último envío de cada jornada.

## Mantenimiento

**Plantilla (`data/plantilla.json`).** Cada jugador:

```json
{ "nombre": "Minos", "corto": "Minos", "dorsal": 7, "posicion": "MED",
  "pie": "Diestro", "edad": 27, "capitan": false,
  "foto": "img/jugadores/minos.jpg", "descripcion": "Texto corto" }
```

- `posicion`: `POR`, `DEF`, `MED`, `DEL` o vacío (`""` = por definir).
- `dorsal`: número o `null`.
- `foto`: opcional. Sube la imagen a `img/jugadores/` y pon su ruta.

**Añadir un jugador nuevo:**
1. Añádelo a `data/plantilla.json`.
2. En el formulario (Editar), añade su nombre como fila en *Nota de cada jugador*, *Goles de cada jugador*, *Asistencias de cada jugador* y *Tarjetas*, y como opción en *Once titular* y *MVP del partido*.
3. El nombre tiene que ser **idéntico** en los dos sitios, con tildes incluidas.

**Calendario (`data/calendario.json`).** Un partido por línea. La fecha va como `dd/mm/aaaa` y la hora como `18:30`. Los resultados no se escriben aquí: salen solos del formulario.

```json
{ "jornada": 5, "fecha": "02/11/2026", "hora": "11:00", "rival": "Nombre rival", "local": true, "campo": "Polideportivo X" }
```

## Probarla en tu ordenador

Abrir `index.html` con doble clic no funciona (el navegador bloquea la lectura de los archivos de datos). En la carpeta, ejecuta `python3 -m http.server` y abre http://localhost:8000.
