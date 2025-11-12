const PDF_JS_CDN = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs";
const PDF_JS_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";

type PdfTextItem = {
  str?: string;
};

type PdfTextContent = {
  items: PdfTextItem[];
};

type PdfPage = {
  getTextContent: () => Promise<PdfTextContent>;
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
};

type PdfModule = {
  GlobalWorkerOptions?: { workerSrc: string };
  getDocument: (options: { data: ArrayBuffer }) => { promise: Promise<PdfDocument> };
};

export type PdfTextPage = {
  pageNumber: number;
  text: string;
};

let pdfModulePromise: Promise<PdfModule | null> | null = null;

const loadPdfModule = async (): Promise<PdfModule | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  if (pdfModulePromise) {
    return pdfModulePromise;
  }

  pdfModulePromise = import(/* @vite-ignore */ PDF_JS_CDN)
    .then((mod: unknown) => {
      const pdfjsCandidate = (mod as { default?: unknown })?.default ?? mod;
      const pdfjs = pdfjsCandidate as PdfModule;
      if (pdfjs?.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER;
      }
      return pdfjs;
    })
    .catch((error: unknown) => {
      console.error("Failed to load pdf.js from CDN", error);
      pdfModulePromise = null;
      return null;
    });

  return pdfModulePromise;
};

export const extractPdfPages = async (file: File): Promise<PdfTextPage[]> => {
  const pdfjs = await loadPdfModule();
  if (!pdfjs) {
    throw new Error("Kunde inte ladda pdf.js biblioteket för att läsa dokumentet");
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pages: PdfTextPage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => (typeof item.str === "string" ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({
      pageNumber,
      text: pageText,
    });
  }

  return pages;
};

export const buildTextPageFromFile = async (file: File): Promise<PdfTextPage[]> => {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return extractPdfPages(file);
  }

  const text = await file.text();
  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  return [{ pageNumber: 1, text: normalized }];
};
