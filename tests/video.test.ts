import { test } from "node:test";
import assert from "node:assert/strict";
import { getDefaultContent } from "../src/lib/default-content";
import { parseSiteContent } from "../src/lib/content-validation";
import { isSafeVideoSource, MAX_VIDEO_BYTES, validateVideoFile } from "../src/lib/video";
import { checkVideo } from "../src/components/admin/video-upload";

const origin = "https://project.supabase.co";
const path = "11111111-1111-4111-8111-111111111111/00000000-0000-4000-8000-000000000001.mp4";
const src = `${origin}/storage/v1/object/public/drone-videos/${path}`;
const video = { id: "video-1", src, title: "Test de zbor", description: "Pilotare", mimeType: "video/mp4" as const };

test("old publications retain every field and gain an empty videos list", () => {
  const original = getDefaultContent();
  original.gallery.push({ id: "photo", src: "/images/test.webp", alt: "Drona", caption: "" });
  original.heroImageId = "photo";
  const legacy: Record<string, unknown> = { ...original };
  delete legacy.videos;
  assert.deepEqual(parseSiteContent(legacy), original);
});

test("video content round-trips and rejects forged sources, formats and duplicate IDs", () => {
  const content = getDefaultContent(); content.videos = [video];
  assert.deepEqual(parseSiteContent(content, origin).videos, [video]);
  for (const invalid of [
    src.replace(origin, "https://attacker.test"), src.replace("drone-videos", "drone-images"),
    src + "?token=secret", src + "#fragment", src.replace(".mp4", ".svg"),
    src.replace("/public/", "/public/../public/"), src.replace("/public/", "/public/%2e%2e/public/"),
    src.replace("https://", "https://user:password@"), "javascript:alert(1)",
  ]) {
    assert.equal(isSafeVideoSource(invalid, origin), false);
    assert.throws(() => parseSiteContent({ ...content, videos: [{ ...video, src: invalid }] }, origin));
  }
  assert.throws(() => parseSiteContent({ ...content, videos: [{ ...video, mimeType: "video/webm" }] }, origin));
  assert.throws(() => parseSiteContent({ ...content, videos: [video, video] }, origin), /duplicat/);
  assert.throws(() => parseSiteContent({ ...content, videos: Array.from({ length: 13 }, (_, i) => ({ ...video, id: `video-${i}` })) }, origin));
});

test("video uploads reject empty, oversized and mismatched files", () => {
  assert.equal(validateVideoFile({ name: "test.mp4", type: "video/mp4", size: MAX_VIDEO_BYTES }), "mp4");
  for (const size of [0, -1, 1.5, MAX_VIDEO_BYTES + 1, NaN]) assert.throws(() => validateVideoFile({ name: "test.mp4", type: "video/mp4", size }));
  assert.throws(() => validateVideoFile({ name: "test.mov", type: "video/quicktime", size: 50 }));
  assert.throws(() => validateVideoFile({ name: "test.mp4", type: "video/webm", size: 50 }));
});

test("client checks reject renamed HTML and recognize container headers", async () => {
  await assert.rejects(() => checkVideo(new File(["<html>not video</html>"], "test.mp4", { type: "video/mp4" })));
  await assert.doesNotReject(() => checkVideo(new File([new Uint8Array([0,0,0,24,102,116,121,112,105,115,111,109])], "test.mp4", { type: "video/mp4" })));
  await assert.doesNotReject(() => checkVideo(new File([new Uint8Array([0x1a,0x45,0xdf,0xa3,0])], "test.webm", { type: "video/webm" })));
});
