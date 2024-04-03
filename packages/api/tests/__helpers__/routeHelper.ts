import path from "path";

export function versionnedUrl(url: string, version: "v1" | "v2" = "v2"): string {
    return path.join("/", version, url);
}
