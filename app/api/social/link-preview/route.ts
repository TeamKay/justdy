
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { IncomingMessage } from "node:http";
import { NextRequest, NextResponse } from "next/server";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";

export const runtime = "nodejs";

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 8_000;

type PreviewMetadata = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string;
};

function isPublicIPv4(address: string): boolean {
  if (isIP(address) !== 4) return false;

  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;

  if (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51) ||
    (a === 203 && b === 0)
  ) {
    return false;
  }

  return true;
}

async function resolvePublicIPv4(hostname: string): Promise<string> {
  if (isIP(hostname) !== 0) {
    if (!isPublicIPv4(hostname)) {
      throw new Error("This address is not publicly accessible.");
    }

    return hostname;
  }

  const records = await lookup(hostname, {
    family: 4,
    all: true,
    verbatim: true,
  });

  if (records.length === 0 || records.some((record) => !isPublicIPv4(record.address))) {
    throw new Error("The website resolves to an unsafe network address.");
  }

  return records[0].address;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    .trim();
}

function getMetaContent(html: string, names: string[]): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const attributes: Record<string, string> = {};
    const attributePattern =
      /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

    let match: RegExpExecArray | null;

    while ((match = attributePattern.exec(tag)) !== null) {
      attributes[match[1].toLowerCase()] =
        match[2] ?? match[3] ?? match[4] ?? "";
    }

    const key = (attributes.property ?? attributes.name ?? "").toLowerCase();

    if (names.includes(key) && attributes.content) {
      return decodeHtml(attributes.content);
    }
  }

  return null;
}

function getTitle(html: string): string | null {
  const metadataTitle = getMetaContent(html, [
    "og:title",
    "twitter:title",
  ]);

  if (metadataTitle) return metadataTitle;

  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1].replace(/<[^>]*>/g, "")) : null;
}

function getDescription(html: string): string | null {
  return getMetaContent(html, [
    "og:description",
    "twitter:description",
    "description",
  ]);
}

function normalizeImageUrl(
  image: string | null,
  pageUrl: URL,
): string | null {
  if (!image) return null;

  try {
    const parsed = new URL(image, pageUrl);

    if (
      (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function fetchHtml(
  url: URL,
  resolvedAddress: string,
): Promise<{ statusCode: number; headers: IncomingMessage["headers"]; body: string; location?: string }> {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const port = url.port
      ? Number(url.port)
      : url.protocol === "https:"
        ? 443
        : 80;

    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: {
          "User-Agent": "JustdyLinkPreview/1.0",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Encoding": "identity",
          Connection: "close",
        },
        timeout: REQUEST_TIMEOUT_MS,
        // Connect to the IP address that was checked above, not a fresh DNS result.
               // Connect only to the IP address validated by resolvePublicIPv4().
               lookup: (((
          _hostname,
          options,
          callback,
        ) => {
          if (options && typeof options === "object" && "all" in options && options.all) {
            callback(null, [
              {
                address: resolvedAddress,
                family: 4,
              },
            ]);
            return;
          }

          callback(null, resolvedAddress, 4);
        }) as LookupFunction),
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        const location = response.headers.location;
        const contentType = response.headers["content-type"] ?? "";

        if (
          statusCode >= 300 &&
          statusCode < 400 &&
          location
        ) {
          response.resume();
          resolve({
            statusCode,
            headers: response.headers,
            body: "",
            location,
          });
          return;
        }

        if (
          statusCode < 200 ||
          statusCode >= 300 ||
          !contentType.toLowerCase().includes("text/html")
        ) {
          response.resume();
          resolve({
            statusCode,
            headers: response.headers,
            body: "",
          });
          return;
        }

        const chunks: Buffer[] = [];
        let totalBytes = 0;

        response.on("data", (chunk: Buffer | string) => {
          const buffer = Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk);

          totalBytes += buffer.length;

          if (totalBytes > MAX_RESPONSE_BYTES) {
            request.destroy(new Error("The webpage is too large."));
            return;
          }

          chunks.push(buffer);
        });

        response.on("end", () => {
          resolve({
            statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });

        response.on("error", reject);
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("The webpage request timed out."));
    });

    request.on("error", reject);
    request.end();
  });
}

async function retrieveHtml(initialUrl: URL): Promise<{
  finalUrl: URL;
  html: string;
}> {
  let currentUrl = initialUrl;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    if (
      (currentUrl.protocol !== "https:" && currentUrl.protocol !== "http:") ||
      currentUrl.username ||
      currentUrl.password ||
      currentUrl.port === "80" && currentUrl.protocol === "https:" ||
      currentUrl.port === "443" && currentUrl.protocol === "http:"
    ) {
      throw new Error("This URL is not supported.");
    }

    const address = await resolvePublicIPv4(currentUrl.hostname);
    const response = await fetchHtml(currentUrl, address);

    if (response.location) {
      if (redirect === MAX_REDIRECTS) {
        throw new Error("The website redirected too many times.");
      }

      currentUrl = new URL(response.location, currentUrl);
      continue;
    }

    if (!response.body) {
      throw new Error("The website did not return a readable HTML page.");
    }

    return {
      finalUrl: currentUrl,
      html: response.body,
    };
  }

  throw new Error("Unable to retrieve the webpage.");
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl || rawUrl.length > 2_048) {
    return NextResponse.json(
      { error: "Please provide a valid webpage URL." },
      { status: 400 },
    );
  }

  try {
    const url = new URL(rawUrl);

    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return NextResponse.json(
        { error: "Only public HTTP and HTTPS webpages are supported." },
        { status: 400 },
      );
    }

    const { finalUrl, html } = await retrieveHtml(url);

    const title = getTitle(html);
    const description = getDescription(html);
    const image =
      getMetaContent(html, ["og:image", "twitter:image"]) ??
      getMetaContent(html, ["og:image:url"]);

    const metadata: PreviewMetadata = {
      url: finalUrl.toString(),
      title,
      description,
      image: normalizeImageUrl(image, finalUrl),
      domain: finalUrl.hostname.replace(/^www\./i, ""),
    };

    return NextResponse.json(metadata, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
    } catch (error) {
    console.error("[Social link preview error]:", error);

    return NextResponse.json(
      { error: "We couldn't retrieve a preview for this link." },
      { status: 422 },
    );
  }
}
