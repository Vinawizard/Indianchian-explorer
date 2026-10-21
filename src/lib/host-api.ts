/**
 * Where copies without the database (Vercel) read mainnet data: the host's public API. Preview
 * builds of an unmerged branch read the host's candidate build (/mainnet-api-preview -> :3003),
 * because the live /mainnet-api runs main's code and lacks this branch's endpoints.
 */
const PREVIEW = process.env.VERCEL_ENV === "preview";
const HOST_API = PREVIEW ? "http://139.59.11.86/mainnet-api-preview" : "http://139.59.11.86/mainnet-api";

export const hostApi = (path: "records" | "anchors", env?: string) => (PREVIEW ? `${HOST_API}/${path}` : env || `${HOST_API}/${path}`);
