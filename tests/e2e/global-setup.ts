import {FullConfig} from "@playwright/test";
import {ensureSeedData} from "./utils/seed";

export default async function globalSetup(_config: FullConfig) {
    await ensureSeedData();
}
