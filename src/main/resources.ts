import { app } from 'electron'
import { join } from 'path'

/**
 * Absolute path to a file from the repo's resources/ folder.
 * In a packaged app these are copied next to the asar via electron-builder's
 * extraResources, so they live under process.resourcesPath instead.
 */
export function resourcePath(file: string): string {
  return app.isPackaged
    ? join(process.resourcesPath, file)
    : join(app.getAppPath(), 'resources', file)
}
