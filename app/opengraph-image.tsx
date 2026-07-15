import { ImageResponse } from "next/og";

export const alt = "Car Quiz — Adivina el coche por la foto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Se genera bajo demanda, no en el build: al tener sharp instalado, generarla
// en build metía a sharp en su pipeline y petaba ("colourspace not set").
export const dynamic = "force-dynamic";

/** Oswald (condensada, negrita) desde Google Fonts. Sin esto, satori solo tiene
 *  una fuente regular y el titular se ve soso. Se descarga en el build. */
async function oswaldBold(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Oswald:wght@700",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\((.+?)\)\s*format/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null; // si falla, se usa la fuente por defecto: feo pero no rompe el build
  }
}

export default async function OgImage() {
  const font = await oswaldBold();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d0e10",
          color: "#f3f3f1",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 16,
            width: "100%",
            background:
              "repeating-linear-gradient(90deg, #e10600 0 44px, #101114 44px 60px)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", padding: "0 70px" }}>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              letterSpacing: 10,
              color: "#8b9098",
            }}
          >
            CAR QUIZ
          </div>

          {/* Dos líneas explícitas: si lo dejo envolver solo, parte mal el "?" */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 96,
              lineHeight: 1.02,
              marginTop: 14,
            }}
          >
            <div style={{ display: "flex" }}>¿SABES QUÉ</div>
            <div style={{ display: "flex" }}>
              COCHE ES<span style={{ color: "#e10600" }}>?</span>
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 32, color: "#8b9098", marginTop: 22 }}>
            Solo tienes la foto. Un reto nuevo cada día.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            padding: "0 70px 54px",
            fontSize: 30,
          }}
        >
          <div style={{ display: "flex", background: "#4f9d4a", padding: "10px 26px" }}>
            FORD
          </div>
          <div style={{ display: "flex", background: "#c9a227", padding: "10px 26px" }}>
            2005 ↑
          </div>
          <div style={{ display: "flex", background: "#383c42", padding: "10px 26px" }}>
            COUPÉ
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Oswald", data: font, weight: 700, style: "normal" }]
        : undefined,
    }
  );
}
