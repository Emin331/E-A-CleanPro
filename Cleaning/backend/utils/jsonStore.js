import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

async function ensureFile(fileName) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const filePath = path.join(DATA_DIR, fileName);
    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, "[]", "utf-8");
    }
    return filePath;
}

export async function readAll(fileName) {
    const filePath = await ensureFile(fileName);
    const raw = await fs.readFile(filePath, "utf-8");
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export async function appendOne(fileName, entry) {
    const filePath = await ensureFile(fileName);
    const items = await readAll(fileName);
    const record = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        createdAt: new Date().toISOString(),
        ...entry
    };
    items.push(record);
    await fs.writeFile(filePath, JSON.stringify(items, null, 2), "utf-8");
    return record;
}

export async function updateOne(fileName, id, patch) {
    const filePath = await ensureFile(fileName);
    const items = await readAll(fileName);
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) return null;

    items[index] = { ...items[index], ...patch };
    await fs.writeFile(filePath, JSON.stringify(items, null, 2), "utf-8");
    return items[index];
}
