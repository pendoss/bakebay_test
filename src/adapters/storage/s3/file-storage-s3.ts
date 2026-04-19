import {UploadFile} from '@/src/adapters/storage/s3'
import type {FileStorage} from '@/src/application/ports/file-storage'

export function fileStorageS3(): FileStorage {
    return {
        upload(key: string, file: File): Promise<string> {
            return UploadFile(key, file)
        },
    }
}
