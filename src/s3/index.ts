import * as Minio from 'minio'
import * as stream from "node:stream";
import { Readable } from 'stream';

const minioClient = new Minio.Client({
    endPoint: process.env.S3_ENDPOINT!,
    useSSL: true,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
})

const bucket = process.env.S3_BUCKET_NAME!

function assembleUrl (key: string){
    let res = "";
    if (process.env.S3_USE_SSL === "true") {
        res = "https://" + process.env.S3_ENDPOINT + "/" + bucket + "/" + key;
    } else {
        res = "http://" + process.env.S3_ENDPOINT + "/" + bucket + "/" + key;
    }

    return res;
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
        const res = await minioClient.putObject(bucket, key, buffer, undefined, metaData);
        return assembleUrl(key);
    }

    // Handle other types as before
    // Uploading the file to S3 bucket
    const res = await minioClient.putObject(bucket, key, obj, undefined, metaData);
    return assembleUrl(key);
}
// await minioClient.fPutObject(bucket, destinationObject, sourceFile, metaData)
// console.log('File ' + sourceFile + ' uploaded as object ' + destinationObject + ' in bucket ' + bucket)
