# Car Quiz 🚗

Adivina el coche por la foto. Dos modos: **Coche del día** (estilo Wordle, uno
compartido por todos) y **Modo infinito** (encadena aciertos; la dificultad sube
con la racha).

## Cómo funciona

- **Coche del día:** adivina **marca + modelo + año**. Pistas por casilla:
  🟩 verde = exacto, 🟨 amarillo = cerca (año ±3), ⬜ gris = no. 6 intentos.
- **Modo infinito:** eliges qué modos y regiones entran; cada ronda sale uno al
  azar. Con cada acierto la foto se revela menos (más desenfoque / rejilla más
  fina). Un fallo reinicia la racha.
- La foto empieza tapada según el modo: entera, **desenfocada** o **por zonas**
  (rejilla con giro 3D).

## Datos (provisional: JSON)

- `cars.json` — pool de coches con foto (de aquí sale la respuesta).
- `reference/vehicles.json` — catálogo de autocompletado (NHTSA vPIC).
- `reference/extra.json` — suplemento curado de modelos EU/JDM.
- `cars/` — fotos (servidas con id opaco en `/api/img/[id]` para no filtrar la
  respuesta).

Toda la lectura pasa por `lib/db.ts`; migrar a API/BBDD solo toca ese archivo.

### Scripts de datos

```bash
node scripts/build-reference.mjs   # reconstruye el catálogo desde vPIC
node scripts/fetch-photos.mjs      # baja fotos (Wikimedia Commons) de coches sin imagen
node scripts/fetch-photos.mjs --force
```

Las fotos vienen de **Wikimedia Commons** con su atribución (autor + licencia).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

Next.js 16 (App Router) · React 19 · Tailwind v4.

## Despliegue

Pensado para **Vercel** (rutas API en Node). `next.config.ts` incluye
`cars.json` y `cars/` en el bundle serverless. No funciona en hosting solo
estático (GitHub Pages) porque usa route handlers.
