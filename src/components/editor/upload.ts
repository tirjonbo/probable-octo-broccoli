const MAX_SIDE = 3000;

/** Уменьшает фото до MAX_SIDE по длинной стороне (JPEG 92%), затем загружает. Возвращает id. */
export async function uploadPhoto(file: File): Promise<string> {
  let blob: Blob = file;
  let width = 0;
  let height = 0;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    width = bmp.width;
    height = bmp.height;
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    if (scale < 1 || file.size > 8 * 1024 * 1024) {
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(bmp, 0, 0, width, height);
      blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Не удалось обработать фото"))), "image/jpeg", 0.92));
    }
    bmp.close();
  } catch {
    // Браузер не смог декодировать (например, HEIC) — отправим как есть, сервер проверит формат.
  }
  const form = new FormData();
  form.append("file", blob, file.name);
  if (width) form.append("width", String(width));
  if (height) form.append("height", String(height));
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Ошибка загрузки");
  return json.id as string;
}
