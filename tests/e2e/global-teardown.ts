import {cleanupCreatedRecords} from "./utils/seed";

export default async function globalTeardown() {
    await cleanupCreatedRecords();
}
