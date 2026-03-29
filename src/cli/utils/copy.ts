import { cp, rm, symlink, stat, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true, force: true });
}

export async function linkDir(src: string, dest: string): Promise<void> {
  try {
    await rm(dest, { recursive: true, force: true });
  } catch { /* ignore */ }
  await mkdir(join(dest, '..'), { recursive: true });
  await symlink(src, dest, 'dir');
}

export async function removeDir(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

export async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
