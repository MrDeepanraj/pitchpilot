// Extract plain text from an uploaded document of (almost) any format.
// Parsers load dynamically so they stay out of the edge bundle.

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function stripRtf(rtf: string): string {
  return rtf
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\'[0-9a-fA-F]{2}/g, "")
    .replace(/\\[a-zA-Z]+-?\d* ?/g, "")
    .replace(/[{}]/g, "")
    .trim();
}

export const ACCEPT_FORMATS =
  ".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.odp,.ods,.txt,.md,.markdown,.csv,.tsv,.json,.log,.html,.htm,.rtf,.xml";

const OFFICE = ["docx", "pptx", "xlsx", "odt", "odp", "ods", "doc", "ppt", "xls"];
const IMAGE = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "tiff", "ico", "heic"];

export async function extractText(buf: Buffer, filename: string, mime: string): Promise<string> {
  const ext = (filename.split(".").pop() ?? "").toLowerCase();

  if (ext === "pdf" || mime === "application/pdf") {
    const { getDocumentProxy, extractText: pdfExtract } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await pdfExtract(pdf, { mergePages: true });
    return (Array.isArray(text) ? text.join("\n") : text).trim();
  }

  if (ext === "docx") {
    const mammoth = (await import("mammoth")).default;
    const { value } = await mammoth.extractRawText({ buffer: buf });
    if (value.trim()) return value.trim();
    // fall through to officeparser if mammoth returns nothing
  }

  if (OFFICE.includes(ext)) {
    const op: any = await import("officeparser");
    const parse = op.parseOfficeAsync ?? op.default?.parseOfficeAsync;
    return (await parse(buf)).trim();
  }

  if (IMAGE.includes(ext)) {
    throw new Error("Image files can't be read for text. Upload a PDF, Office doc, or text file.");
  }

  // text-like formats (txt, md, csv, tsv, json, log, html, rtf, xml, unknown)
  let text = buf.toString("utf8");
  if (ext === "html" || ext === "htm" || ext === "xml") text = stripTags(text);
  if (ext === "rtf") text = stripRtf(text);
  return text.trim();
}
