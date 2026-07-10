import "server-only";

import { ensureReadable, parseHex } from "@kembali/core";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

/* Print-ready QR kit generation. A merchant's join QR is drawn as vector
 * modules (crisp at any print size) into an A4 or A5 poster with the shop
 * name, logo, the join link as text and short instructions. Colours come
 * from the tenant theme via @kembali/core, kept dark enough that the QR
 * always scans. A standalone high-resolution PNG of the code is also
 * available for a merchant's own materials. */

const KEMBALI_PRIMARY = "#0f3d32";
const KEMBALI_ACCENT = "#e0684b";

export interface KitInput {
  shopName: string;
  joinUrl: string;
  outletName?: string | null;
  logoDataUrl?: string | null;
  primary?: string | null;
  accent?: string | null;
}

export type KitFormat = "a4" | "a5" | "png";

function pdfColor(hex: string) {
  const { r, g, b } = parseHex(hex);
  return rgb(r / 255, g / 255, b / 255);
}

/** A colour dark enough to scan reliably: the brand primary pushed to at
 * least 7:1 on white (near-black for a light primary). */
function qrInk(primary: string): string {
  return ensureReadable(primary, "#ffffff", 7);
}

async function embedLogo(pdf: PDFDocument, dataUrl: string) {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  const [, mime, b64] = match;
  const bytes = Buffer.from(b64!, "base64");
  try {
    if (mime === "image/png") return await pdf.embedPng(bytes);
    if (mime === "image/jpeg" || mime === "image/jpg") return await pdf.embedJpg(bytes);
  } catch {
    // Unsupported/corrupt image (e.g. WebP): skip the logo, keep the poster.
  }
  return null;
}

const PAGE_SIZES: Record<"a4" | "a5", [number, number]> = {
  a4: [595.28, 841.89],
  a5: [419.53, 595.28],
};

export async function generateKitPdf(
  input: KitInput,
  size: "a4" | "a5",
): Promise<Uint8Array> {
  const primary = input.primary || KEMBALI_PRIMARY;
  const accent = input.accent || KEMBALI_ACCENT;
  const ink = qrInk(primary);
  const headingColor = ensureReadable(primary, "#ffffff", 4.5);

  const pdf = await PDFDocument.create();
  const [w, h] = PAGE_SIZES[size];
  const page = pdf.addPage([w, h]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const margin = w * 0.1;
  const centerText = (
    text: string,
    y: number,
    font: typeof bold,
    fontSize: number,
    color = rgb(0.09, 0.15, 0.12),
  ) => {
    const tw = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, { x: (w - tw) / 2, y, size: fontSize, font, color });
  };

  // Accent bar along the top.
  page.drawRectangle({ x: 0, y: h - 10, width: w, height: 10, color: pdfColor(accent) });

  let cursorY = h - margin - 8;

  // Logo (optional), then shop name.
  const logo = input.logoDataUrl ? await embedLogo(pdf, input.logoDataUrl) : null;
  if (logo) {
    const logoSize = w * 0.16;
    const dims = logo.scaleToFit(logoSize, logoSize);
    page.drawImage(logo, {
      x: (w - dims.width) / 2,
      y: cursorY - dims.height,
      width: dims.width,
      height: dims.height,
    });
    cursorY -= dims.height + 18;
  }

  const nameSize = size === "a4" ? 30 : 22;
  centerText(input.shopName, cursorY - nameSize, bold, nameSize, pdfColor(headingColor));
  cursorY -= nameSize + 8;

  const tagSize = size === "a4" ? 16 : 13;
  centerText("Scan to collect stamps", cursorY - tagSize, regular, tagSize, rgb(0.36, 0.42, 0.38));
  cursorY -= tagSize + 24;

  // Vector QR: draw each dark module as a filled square.
  const qr = QRCode.create(input.joinUrl, { errorCorrectionLevel: "M" });
  const count = qr.modules.size;
  const data = qr.modules.data;
  const qrSize = Math.min(w - margin * 2, cursorY - margin * 3.2);
  const cell = qrSize / count;
  const qrX = (w - qrSize) / 2;
  const qrY = cursorY - qrSize;
  const inkColor = pdfColor(ink);
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (data[row * count + col]) {
        page.drawRectangle({
          x: qrX + col * cell,
          y: qrY + (count - 1 - row) * cell,
          width: cell + 0.4, // slight overlap to avoid hairline gaps in print
          height: cell + 0.4,
          color: inkColor,
        });
      }
    }
  }
  cursorY = qrY - 26;

  // Instructions + the join link as text.
  centerText(
    "Point your phone camera at the code to start your card.",
    cursorY,
    regular,
    size === "a4" ? 12 : 10,
    rgb(0.36, 0.42, 0.38),
  );
  cursorY -= 20;
  const linkSize = size === "a4" ? 11 : 9;
  centerText(input.joinUrl, cursorY, mono, linkSize, pdfColor(headingColor));

  // Footer: outlet + Kembali credit.
  page.drawRectangle({ x: margin, y: margin + 22, width: w - margin * 2, height: 1, color: rgb(0.86, 0.84, 0.75) });
  if (input.outletName) {
    centerText(input.outletName, margin + 8, regular, 10, rgb(0.55, 0.59, 0.54));
  }
  centerText("Powered by Kembali", margin - 4, regular, 8, rgb(0.68, 0.71, 0.66));

  return pdf.save();
}

export async function generateKitPng(input: KitInput): Promise<Buffer> {
  const primary = input.primary || KEMBALI_PRIMARY;
  return QRCode.toBuffer(input.joinUrl, {
    errorCorrectionLevel: "M",
    width: 1024,
    margin: 2,
    color: { dark: qrInk(primary), light: "#ffffff" },
  });
}
