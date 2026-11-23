/**
 * Compressão de fotos no próprio aparelho, antes de salvar.
 *
 * A foto da câmera chega com 3–5 MB. Aqui ela é redimensionada (lado maior = 800 px)
 * e convertida para JPEG, baixando a qualidade até caber no limite.
 * Resultado: um "data URL" (texto) que cabe dentro de um documento do Firestore.
 */

/** Limite em caracteres. A regra do Firestore aceita até 400.000; deixamos folga. */
export const MAX_IMAGE_CHARS = 350_000

export class ImageTooLargeError extends Error {}

export async function compressImage(file, { maxSide = 800, maxChars = MAX_IMAGE_CHARS } = {}) {
  const image = await loadImage(file)

  const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(image, 0, 0, width, height)

  // Começa com boa qualidade e vai baixando até caber.
  for (let quality = 0.8; quality >= 0.3; quality -= 0.1) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (dataUrl.length <= maxChars) return dataUrl
  }
  throw new ImageTooLargeError('Não foi possível comprimir a foto o suficiente.')
}

/** Lê o arquivo como imagem. Navegadores modernos já corrigem a rotação da câmera. */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Arquivo de imagem inválido.'))
    }
    image.src = url
  })
}
