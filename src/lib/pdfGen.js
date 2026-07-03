// ─── GÉNÉRATION PDF (html2pdf.js — import dynamique) ─────────────────────────
// Import dynamique : html2pdf.js (~600 Ko) n'est chargé que quand on en a besoin,
// sans impacter le bundle principal de l'app.

let _lib = null;
async function getHtml2pdf() {
  if (!_lib) {
    const mod = await import("html2pdf.js");
    _lib = mod.default ?? mod;
  }
  return _lib;
}

// ─── OPTIONS PAR DÉFAUT ───────────────────────────────────────────────────────
const PDF_OPTS = {
  margin: 0,
  filename: "document.pdf",
  image:      { type: "jpeg", quality: 0.85 },
  html2canvas: {
    scale: 2,
    useCORS: true,       // pour les images Firebase Storage (CORS public)
    allowTaint: false,
    logging: false,
    letterRendering: true,
  },
  jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
};

// ─── CONVERTIR HTML STRING → base64 PDF ──────────────────────────────────────
// Retourne une chaîne base64 pure (sans le préfixe data:application/pdf;base64,)
// Utilisable directement comme attachment Resend : { filename, content: base64 }
export async function generatePDFBase64(htmlString, opts = {}) {
  const html2pdf = await getHtml2pdf();

  // Injecter dans un div hors écran pour le rendu
  const container = document.createElement("div");
  container.style.cssText =
    "position:absolute;left:-9999px;top:0;width:210mm;background:#fff;";
  container.innerHTML = htmlString;
  document.body.appendChild(container);

  try {
    const mergedOpts = { ...PDF_OPTS, ...opts };

    // Générer le PDF et récupérer comme blob
    const blob = await new Promise((resolve, reject) => {
      html2pdf()
        .set(mergedOpts)
        .from(container)
        .toPdf()
        .get("pdf")
        .then((pdf) => resolve(pdf.output("blob")))
        .catch(reject);
    });

    // Blob → base64 string
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } finally {
    try { document.body.removeChild(container); } catch { /* noop */ }
  }
}
