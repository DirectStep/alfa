const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Префиксует локальный путь в /public базовым путём GitHub Pages (если он задан при сборке). */
export function assetPath(path: string): string {
  return `${basePath}${path}`;
}
