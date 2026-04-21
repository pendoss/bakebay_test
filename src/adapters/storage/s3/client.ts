import * as Minio from 'minio'
import * as stream from 'node:stream';
import {publicS3Url} from './url'

const minioClient = new Minio.Client({
    endPoint: (process.env.S3_ENDPOINT ?? '').replace(/:\d+$/, ''),
    port: process.env.S3_PORT ? parseInt(process.env.S3_PORT, 10) : undefined,
    useSSL: process.env.S3_USE_SSL !== 'false',
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
})

const bucket = process.env.S3_BUCKET_NAME ?? ''

function assembleUrl(key: string) {
    return publicS3Url(key)
}

export const UploadFile = async (key: string, obj: stream.Readable | Buffer | string | File): Promise<string> => {
    const metaData = {
        'Content-Type': 'image/*'
    }

    // Handle File object by converting it to a Buffer
    if (obj instanceof File) {
        const arrayBuffer = await obj.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // Uploading the file to S3 bucket
        await minioClient.putObject(bucket, key, buffer, undefined, metaData);
        return assembleUrl(key);
    }

    // Handle other types as before
    // Uploading the file to S3 bucket
    await minioClient.putObject(bucket, key, obj, undefined, metaData);
    return assembleUrl(key);
}
// await minioClient.fPutObject(bucket, destinationObject, sourceFile, metaData)
// console.log('File ' + sourceFile + ' uploaded as object ' + destinationObject + ' in bucket ' + bucket)
