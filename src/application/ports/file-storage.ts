export interface FileStorage {
    upload(key: string, file: File): Promise<string>
}
