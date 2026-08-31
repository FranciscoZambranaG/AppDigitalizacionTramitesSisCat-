import { PDFDocument } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

// Reemplaza a react-native-pdf-from-image (createPdf).
// Toma una lista de URIs de imagenes (JPEG/PNG) y arma un PDF A4, una imagen
// por pagina, ajustada a la pagina manteniendo la relacion de aspecto.
const A4 = { width: 595.28, height: 841.89 }; // puntos, tamano A4 vertical

export const crearPdfDesdeImagenes = async (
  imagePaths,
  { name = 'documento' } = {},
) => {
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
    throw new Error('No hay imagenes para crear el documento');
  }

  const pdfDoc = await PDFDocument.create();

  for (const uri of imagePaths) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const lower = uri.toLowerCase();
    const isPng = lower.endsWith('.png');
    const image = isPng
      ? await pdfDoc.embedPng(base64)
      : await pdfDoc.embedJpg(base64);

    const page = pdfDoc.addPage([A4.width, A4.height]);
    const margin = 20;
    const maxW = A4.width - margin * 2;
    const maxH = A4.height - margin * 2;
    const scale = Math.min(maxW / image.width, maxH / image.height, 1);
    const w = image.width * scale;
    const h = image.height * scale;

    page.drawImage(image, {
      x: (A4.width - w) / 2,
      y: (A4.height - h) / 2,
      width: w,
      height: h,
    });
  }

  const pdfBase64 = await pdfDoc.saveAsBase64();
  const filePath = `${FileSystem.cacheDirectory}${name}_${Date.now()}.pdf`;
  await FileSystem.writeAsStringAsync(filePath, pdfBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return { filePath };
};

export default crearPdfDesdeImagenes;
