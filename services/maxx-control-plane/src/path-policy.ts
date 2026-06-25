import path from "node:path";

export function resolveInsideRoot(root: string, requestedPath: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, requestedPath);
  const relative = path.relative(resolvedRoot, resolvedPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Requested path is outside MAXX_ICM_ROOT");
  }

  return resolvedPath;
}
