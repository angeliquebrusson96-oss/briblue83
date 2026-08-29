// ─── IMPORT PDF (SCAN / PHOTO) — OCR CÔTÉ NAVIGATEUR ────────────────────────
// Les rapports reçus par mail sont désormais des PDF scannés (photo du papier
// ou export scanner). Un PDF scanné ne contient pas de texte sélectionnable :
// il faut d'abord le convertir en image (pdf.js) puis lire le texte dessus
// (tesseract.js, OCR). L'OCR sur un document scanné n'est jamais fiable à
// 100 % (angle, qualité, écriture) — cet import est donc conçu pour PRÉ-remplir
// les champs, à valider/corriger par le technicien avant sauvegarde.

let _pdfjs = null;
async function getPdfjs() {
  if (_pdfjs) return _pdfjs;
  const pdfjs = await import("pdfjs-dist");
  // Worker chargé depuis le CDN jsdelivr (évite de bundler le fichier worker séparément)
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  _pdfjs = pdfjs;
  return pdfjs;
}

let _tesseractWorkerPromise = null;
async function getOcrWorker() {
  if (_tesseractWorkerPromise) return _tesseractWorkerPromise;
  _tesseractWorkerPromise = (async () => {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("fra");
    return worker;
  })();
  return _tesseractWorkerPromise;
}

// Rend chaque page d'un PDF en image (dataURL PNG) via un <canvas>
async function pdfFileToImages(file, onProgress) {
  const pdfjs = await getPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const images = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(`Page ${i}/${pdf.numPages}…`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.2 }); // résolution correcte pour l'OCR
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL("image/png"));
  }
  return images;
}

// OCR d'un fichier PDF (scan) → texte brut concaténé de toutes les pages
export async function ocrPdfFile(file, onProgress) {
  onProgress?.("Ouverture du PDF…");
  const images = await pdfFileToImages(file, onProgress);
  const worker = await getOcrWorker();
  let fullText = "";
  for (let i = 0; i < images.length; i++) {
    onProgress?.(`Lecture OCR page ${i + 1}/${images.length}…`);
    const { data } = await worker.recognize(images[i]);
    fullText += data.text + "\n";
  }
  return fullText;
}

// Libère le worker OCR (à appeler à la fermeture de la modale d'import)
export async function terminateOcrWorker() {
  if (!_tesseractWorkerPromise) return;
  try {
    const worker = await _tesseractWorkerPromise;
    await worker.terminate();
  } catch { /* noop */ } finally {
    _tesseractWorkerPromise = null;
  }
}

// ─── PARSER HEURISTIQUE — texte OCR brut → champs de rapport ───────────────
// Contrairement au parser HTML (structure fiable .field-label/.field-value),
// le texte OCR est en vrac : on cherche des motifs "Label ... valeur" ligne
// par ligne. Résultat fourni comme BASE À CORRIGER, jamais injecté tel quel.
const MOIS = { janvier:"01",février:"02",mars:"03",avril:"04",mai:"05",juin:"06",
  juillet:"07",août:"08",septembre:"09",octobre:"10",novembre:"11",décembre:"12" };

function parseDateFR(s) {
  if (!s) return "";
  const m1 = s.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (m1) { const mo = MOIS[m1[2].toLowerCase()]; if (mo) return `${m1[3]}-${mo}-${m1[1].padStart(2,"0")}`; }
  const m3 = s.match(/(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/);
  if (m3) return `${m3[3]}-${m3[2]}-${m3[1]}`;
  return "";
}

// Cherche un motif "label : valeur" ou "label\nvaleur" dans le texte OCR brut
function findField(text, labels, numeric = false) {
  for (const label of labels) {
    // "Label : 7.2" ou "Label 7.2" sur la même ligne
    const re = new RegExp(label + "\\s*[:\\-]?\\s*([0-9][0-9.,]*|[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\\s]{1,25})", "i");
    const m = text.match(re);
    if (m && m[1]) {
      const v = m[1].trim();
      if (!numeric || /^[0-9]/.test(v)) return v.replace(",", ".");
    }
  }
  return "";
}

export function parseOCRText(text, fileName = "") {
  const clean = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");

  // Nom client : cherche après "Client" ; sinon 1ère ligne en MAJUSCULES plausible
  let clientNom = findField(clean, ["client", "nom client", "nom du client"]);
  if (!clientNom) {
    const lines = clean.split("\n").map(l => l.trim()).filter(Boolean);
    const candidate = lines.find(l => /^[A-ZÀ-Ý][A-ZÀ-Ýa-zà-ÿ\s\-]{3,30}$/.test(l) && l.split(" ").length <= 4);
    if (candidate) clientNom = candidate;
  }

  const dateRaw = findField(clean, ["date"]) ||
    (clean.match(/(\d{1,2}\s+\w+\s+\d{4})/) || [])[1] ||
    (clean.match(/(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})/) || [])[1] || "";

  return {
    clientNom,
    date: parseDateFR(dateRaw),
    tech: findField(clean, ["technicien"]),
    type: findField(clean, ["type"]),
    ph:           findField(clean, ["ph"], true),
    chloreLibre:  findField(clean, ["chlore libre", "chlore"], true),
    alcalinite:   findField(clean, ["alcalinit[ée]", "tac"], true),
    stabilisant:  findField(clean, ["stabilisant", "cya"], true),
    tChlore:      findField(clean, ["taux chlore"]),
    tPH:          findField(clean, ["taux ph"]),
    tSel:         findField(clean, ["taux sel", "sel"], true),
    tPhosphate:   findField(clean, ["taux phosphate", "phosphate"], true),
    qualiteEau:   findField(clean, ["qualit[ée] eau", "qualit[ée] de l.eau"]),
    etatFond: [], etatParois: [], etatLocal: [], etatBacTampon: [], etatVoletBac: [],
    corrChlore: "", corrPH: "", corrSel: "", corrAlgicide: "", corrPeroxyde: "",
    corrChloreChoc: "", corrPhosphate: "", corrAlcafix: "", corrAutre: "",
    devis: null, priseEchantillon: null, presenceClient: null, ressenti: 0,
    commentaires: findField(clean, ["commentaires", "observations", "remarques"]),
    livraisonProduits: null, produitsLivres: [],
    photoArrivee: "", photos: [], photoDepart: "", photosDepart: [],
    signatureTech: "", signatureClient: "",
    _rawText: clean,
    _sourceFile: fileName,
    _lowConfidence: true, // toujours vrai pour l'OCR — à valider par le technicien
  };
}
