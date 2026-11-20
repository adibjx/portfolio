/**
 * Byte length of each /videos/*.mp4 when the asset response has no
 * Content-Length. The deploy step can fill this in.
 */
export const SIZES = {};

const VIDEO_PATH = /^\/videos\/[^/]+\.mp4$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return env.ASSETS.fetch(request);
    }
    if (!VIDEO_PATH.test(url.pathname)) {
      return env.ASSETS.fetch(request);
    }
    return serveVideo(request, env, url);
  },
};

async function serveVideo(request, env, url) {
  const assetUrl = new URL(url.pathname, url.origin);
  const asset = await env.ASSETS.fetch(new Request(assetUrl, { method: "GET" }));
  if (asset.status !== 200) {
    return asset;
  }

  const sized = await resolveSize(asset, url.pathname);
  const total = sized.total;
  const rangeHeader = request.headers.get("Range");
  const range = rangeHeader ? parseRange(rangeHeader, total) : null;

  if (rangeHeader && !range) {
    return new Response(request.method === "HEAD" ? null : sized.buffer ?? asset.body, {
      status: 200,
      headers: baseHeaders(asset, total),
    });
  }

  if (range && range.unsatisfiable) {
    return new Response(null, {
      status: 416,
      headers: {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes */${total}`,
      },
    });
  }

  if (!range) {
    const body = request.method === "HEAD" ? null : (sized.buffer ?? asset.body);
    return new Response(body, { status: 200, headers: baseHeaders(asset, total) });
  }

  const { start, end } = range;
  const headers = baseHeaders(asset, end - start + 1);
  headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
  if (request.method === "HEAD") {
    return new Response(null, { status: 206, headers });
  }
  const body = sized.buffer
    ? sized.buffer.slice(start, end + 1)
    : sliceStream(asset.body, start, end);
  return new Response(body, { status: 206, headers });
}

async function resolveSize(response, pathname) {
  const header = response.headers.get("Content-Length");
  if (header != null && /^\d+$/.test(header)) {
    return { total: Number(header), buffer: null };
  }
  const listed = SIZES[pathname];
  if (Number.isFinite(listed) && listed >= 0) {
    return { total: listed, buffer: null };
  }
  const buffer = await response.arrayBuffer();
  return { total: buffer.byteLength, buffer };
}

function parseRange(header, size) {
  const first = header.split(",")[0].trim();
  const match = /^bytes=(\d*)-(\d*)$/.exec(first);
  if (!match || size < 0) return null;
  const startText = match[1];
  const endText = match[2];
  if (startText === "" && endText === "") return null;

  let start;
  let end;
  if (startText === "") {
    const suffix = Number(endText);
    if (suffix === 0) return { unsatisfiable: true };
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(startText);
    end = endText === "" ? size - 1 : Number(endText);
    if (end >= size) end = size - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= size || start > end) {
    return { unsatisfiable: true };
  }
  return { start, end };
}

function baseHeaders(asset, length) {
  const headers = new Headers();
  headers.set("Content-Type", "video/mp4");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Length", String(length));
  for (const name of ["Cache-Control", "ETag", "Last-Modified"]) {
    const value = asset.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

function sliceStream(body, start, end) {
  const reader = body.getReader();
  let offset = 0;
  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        const chunkStart = offset;
        offset += value.byteLength;
        if (offset <= start) continue;
        const from = Math.max(0, start - chunkStart);
        const to = Math.min(value.byteLength, end - chunkStart + 1);
        if (to > from) controller.enqueue(value.slice(from, to));
        if (offset > end) {
          controller.close();
          await reader.cancel();
          return;
        }
      }
    },
    cancel() {
      return reader.cancel();
    },
  });
}
