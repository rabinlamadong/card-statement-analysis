export type SortDir = "asc" | "desc";

export function nextSort<K extends string>(
  currentKey: K,
  currentDir: SortDir,
  clicked: K,
): { key: K; dir: SortDir } {
  if (currentKey === clicked) {
    return { key: clicked, dir: currentDir === "asc" ? "desc" : "asc" };
  }
  return { key: clicked, dir: "asc" };
}

export function compareValues(left: string | number, right: string | number, dir: SortDir): number {
  const cmp =
    typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right), undefined, { sensitivity: "base" });
  return dir === "asc" ? cmp : -cmp;
}
