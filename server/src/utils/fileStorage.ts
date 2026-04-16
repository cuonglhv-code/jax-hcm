export interface StorageProvider {
  save(buffer: Buffer, filename: string, mimeType: string): Promise<string>
  delete(filePath: string): Promise<void>
  getUrl(filePath: string): string
}

class NotImplementedError extends Error {
  constructor(provider: string) {
    super(`Storage provider "${provider}" is not implemented`)
    this.name = 'NotImplementedError'
  }
}

class LocalStorage implements StorageProvider {
  private basePath: string
  constructor(basePath: string) { this.basePath = basePath }

  async save(buffer: Buffer, filename: string): Promise<string> {
    const fs   = await import('fs/promises')
    const path = await import('path')
    await fs.mkdir(this.basePath, { recursive: true })
    const dest = path.join(this.basePath, filename)
    await fs.writeFile(dest, buffer)
    return `/uploads/${filename}`
  }

  async delete(filePath: string): Promise<void> {
    const fs   = await import('fs/promises')
    const path = await import('path')
    const abs  = path.join(this.basePath, path.basename(filePath))
    await fs.unlink(abs).catch(() => { /* already gone */ })
  }

  getUrl(filePath: string): string { return filePath }
}

class S3Storage implements StorageProvider {
  async save(): Promise<string>  { throw new NotImplementedError('S3') }
  async delete(): Promise<void>  { throw new NotImplementedError('S3') }
  getUrl(_p: string): string     { throw new NotImplementedError('S3') }
}

const provider = process.env.FILE_STORAGE_PROVIDER ?? 'local'
const basePath  = process.env.FILE_STORAGE_PATH    ?? './uploads'

export const storage: StorageProvider =
  provider === 's3' ? new S3Storage() : new LocalStorage(basePath)
