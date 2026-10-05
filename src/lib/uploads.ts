import path from "node:path";
export const documentDirectory = () => path.resolve(/* turbopackIgnore: true */ process.env.DRIVIO_DOCUMENT_DIR ?? path.join(process.cwd(), "storage", "documents"));
export function detectFileType(buffer: Buffer) {
  if (buffer.subarray(0, 5).toString() === "%PDF-") return { mime: "application/pdf", extension: "pdf" };
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: "image/jpeg", extension: "jpg" };
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return { mime: "image/png", extension: "png" };
  if (buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return { mime: "image/webp", extension: "webp" };
  return null;
}
