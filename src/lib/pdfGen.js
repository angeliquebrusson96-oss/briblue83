// ─── GÉNÉRATION PDF (html2canvas + jsPDF directs — import dynamique) ────────
// Import dynamique : ces libs (~600 Ko à elles deux) ne sont chargées que
// quand on en a besoin, sans impacter le bundle principal de l'app.
//
// ⚠️ On n'utilise PAS html2pdf.js (retiré) : sa version 0.14 clone le DOM via
// un mécanisme interne ("snapdom") qui produit un clone à hauteur 0 pour un
// conteneur détaché du flux normal, ce qui génère un PDF entièrement blanc.
// html2canvas appelé directement sur le conteneur fonctionne correctement.
//
// ⚠️ Le conteneur doit rester à opacity:1 (masqué en le plaçant hors-écran,
// PAS via opacity:0) : html2canvas respecte fidèlement l'opacité CSS et
// rendrait un canvas totalement blanc pour un élément à opacity:0, même si
// sa structure DOM et ses styles sont par ailleurs corrects. Confirmé par
// repro pixel par pixel (0 pixel non-blanc avec opacity:0, ~50% avec un
// positionnement hors-écran à opacity:1 sur un contenu identique).

let _html2canvas = null;
async function getHtml2Canvas() {
  if (!_html2canvas) {
    const mod = await import("html2canvas");
    _html2canvas = mod.default ?? mod;
  }
  return _html2canvas;
}

let _jsPDF = null;
async function getJsPDF() {
  if (!_jsPDF) {
    const mod = await import("jspdf");
    _jsPDF = mod.jsPDF ?? mod.default ?? mod;
  }
  return _jsPDF;
}

// ─── CONVERTIR HTML STRING → base64 PDF ──────────────────────────────────────
// Retourne une chaîne base64 pure (sans le préfixe data:application/pdf;base64,)
// Utilisable directement comme attachment Resend : { filename, content: base64 }
export async function generatePDFBase64(htmlString) {
  const [html2canvas, JsPDF] = await Promise.all([getHtml2Canvas(), getJsPDF()]);

  // Injecter hors du viewport visible (opacity:1 — cf. note ci-dessus) plutôt
  // que masqué par opacity, pour que html2canvas capture le contenu réel.
  const container = document.createElement("div");
  container.style.cssText =
    "position:absolute;left:-9999px;top:0;width:210mm;background:#fff;";
  container.innerHTML = htmlString;
  document.body.appendChild(container);

  try {
    // Laisser le temps au navigateur de faire une passe de layout/paint
    // avant la capture (2 rAF ≈ un cycle complet de rendu).
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true, // pour les images Firebase Storage (CORS public)
      allowTaint: false,
      logging: false,
      letterRendering: true,
    });

    const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidthMm  = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();
    const pxPerMm = canvas.width / pageWidthMm;
    const pageHeightPx = Math.floor(pageHeightMm * pxPerMm);

    // Découpe le grand canvas en tranches d'une page chacune → une image par page.
    let renderedPx = 0;
    let first = true;
    while (renderedPx < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceHeightPx;
      slice.getContext("2d").drawImage(
        canvas, 0, renderedPx, canvas.width, sliceHeightPx,
        0, 0, canvas.width, sliceHeightPx
      );
      const imgData = slice.toDataURL("image/jpeg", 0.85);
      if (!first) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, sliceHeightPx / pxPerMm);
      renderedPx += sliceHeightPx;
      first = false;
    }

    const blob = pdf.output("blob");

    // Blob → base64 string
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } finally {
    try { document.body.removeChild(container); } catch { /* noop */ }
  }
}
