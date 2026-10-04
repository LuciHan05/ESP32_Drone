import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { uploadVideo } from "../src/components/admin/video-upload";
import { getSignedVideoUploadEndpoint, VIDEO_BUCKET } from "../src/lib/video";
import type { VideoUploadTicket } from "../src/lib/content-types";

const signedPath = "/storage/v1/upload/resumable/sign";
const objectPath = "11111111-1111-4111-8111-111111111111/00000000-0000-4000-8000-000000000001.mp4";
const fakeToken = "test-only-signed-token-do-not-display";
const fakeApiKey = "sb_publishable_test_only";

async function serverFor(t: TestContext, handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>) {
  const errors: unknown[] = [];
  const server = createServer((req, res) => {
    void handler(req, res).catch(error => {
      errors.push(error);
      res.writeHead(400).end("Local protocol test failed");
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve();
    });
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    assert.deepEqual(errors, [], "the local server must accept the upload protocol");
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

function boundedSignal(t: TestContext) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  t.after(() => { clearTimeout(timer); controller.abort(); });
  return controller.signal;
}

function ticket(base: string): VideoUploadTicket {
  return {
    endpoint: `${base}${signedPath}`,
    apiKey: fakeApiKey,
    token: fakeToken,
    path: objectPath,
    video: {
      id: "video-test", src: `${base}/storage/v1/object/public/${VIDEO_BUCKET}/${objectPath}`,
      title: "Protocol test", description: "", mimeType: "video/mp4",
    },
  };
}

// The real tus-js-client Node adapter accepts Buffer; browser uploads use File.
function nodeFile(bytes: Buffer): File {
  return Object.assign(bytes, { name: "flight.mp4", type: "video/mp4", size: bytes.length }) as unknown as File;
}

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

test("signed video endpoints use direct storage hosts and the signed TUS route", () => {
  assert.equal(getSignedVideoUploadEndpoint("https://project.supabase.co"), "https://project.storage.supabase.co" + signedPath);
  assert.equal(getSignedVideoUploadEndpoint("https://project.supabase.co/"), "https://project.storage.supabase.co" + signedPath);
  assert.equal(getSignedVideoUploadEndpoint("https://project.storage.supabase.co"), "https://project.storage.supabase.co" + signedPath);
  assert.equal(getSignedVideoUploadEndpoint("https://storage.example.com"), "https://storage.example.com" + signedPath);
});

test("video transfer sends signed credentials on POST and PATCH and transfers every byte", async t => {
  const bytes = Buffer.alloc(8 * 1024 * 1024, 0x47);
  bytes.write("ftyp", 4);
  bytes.write("last video bytes", bytes.length - 16);
  const bodies: Buffer[] = [];
  const methods: string[] = [];
  const progress: number[] = [];
  let offset = 0;
  const base = await serverFor(t, async (req, res) => {
    assert.equal(req.headers["x-signature"], fakeToken);
    assert.equal(req.headers.apikey, fakeApiKey);
    assert.equal(req.headers.authorization, undefined, "no user session token should be sent");
    assert.equal(req.headers["tus-resumable"], "1.0.0");
    assert.equal(req.headers["content-type"], "application/offset+octet-stream");
    methods.push(req.method!);
    if (req.method === "POST") {
      assert.equal(req.url, signedPath);
      assert.equal(Number(req.headers["upload-length"]), bytes.length);
      const metadata = Object.fromEntries(String(req.headers["upload-metadata"]).split(",").map(entry => {
        const [key, value] = entry.split(" ");
        return [key, Buffer.from(value, "base64").toString("utf8")];
      }));
      assert.deepEqual(metadata, {
        bucketName: VIDEO_BUCKET, objectName: objectPath, contentType: "video/mp4", cacheControl: "31536000",
      });
    } else {
      assert.equal(req.method, "PATCH");
      assert.equal(req.url, `${signedPath}/test-upload`);
      assert.equal(Number(req.headers["upload-offset"]), offset);
    }
    const body = await readBody(req);
    bodies.push(body);
    offset += body.length;
    res.writeHead(req.method === "POST" ? 201 : 204, {
      "Tus-Resumable": "1.0.0", "Upload-Offset": String(offset),
      ...(req.method === "POST" ? { Location: `${signedPath}/test-upload` } : {}),
    }).end();
  });

  await uploadVideo(nodeFile(bytes), ticket(base), boundedSignal(t), percent => progress.push(percent));
  assert.deepEqual(methods, ["POST", "PATCH"]);
  assert.equal(bodies[0].length, 6 * 1024 * 1024);
  assert.ok(Buffer.concat(bodies).equals(bytes), "all 8 MB must arrive without truncation or corruption");
  assert.equal(progress.at(-1), 100);
  assert.ok(progress.slice(0, -1).every(percent => percent >= 0 && percent <= 99));
});

for (const status of [403, 413]) {
  test(`video transfer reports HTTP ${status} without leaking provider tokens or retrying`, async t => {
    const providerBody = `provider-private-detail token=${fakeToken}`;
    let requests = 0;
    const base = await serverFor(t, async (req, res) => {
      requests++;
      await readBody(req);
      res.writeHead(status, { "Tus-Resumable": "1.0.0", "Content-Type": "text/plain" }).end(providerBody);
    });
    await assert.rejects(
      uploadVideo(nodeFile(Buffer.alloc(32)), ticket(base), boundedSignal(t), () => {}),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, new RegExp(String(status)));
        assert.ok(!error.message.includes(fakeToken));
        assert.ok(!error.message.includes("provider-private-detail"));
        assert.ok(!error.message.includes(fakeApiKey));
        return true;
      },
    );
    assert.equal(requests, 1);
  });
}
