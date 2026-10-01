import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { normalizeImage, readUpload, MAX_IMAGE_BYTES } from "../src/lib/server/image-upload";

test("real JPEG is decoded, resized to WebP and metadata stripped", async () => {
  const input = await sharp({create:{width:2500,height:12,channels:3,background:"red"}}).jpeg().withMetadata().toBuffer();
  const output = await normalizeImage(input);
  const meta = await sharp(output).metadata();
  assert.equal(meta.format, "webp"); assert.equal(meta.width, 2400); assert.equal(meta.exif, undefined);
});

test("disguised SVG, corrupt JPEG and oversized files fail", async () => {
  await assert.rejects(() => normalizeImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')));
  await assert.rejects(() => normalizeImage(Buffer.from([255,216,255,0,0,0])));
  await assert.rejects(() => normalizeImage(Buffer.alloc(MAX_IMAGE_BYTES + 1)));
});

test("oversized image dimensions fail before allocating output", async () => {
  const input = await sharp({create:{width:9000,height:2,channels:3,background:"white"}}).png().toBuffer();
  await assert.rejects(() => normalizeImage(input));
});

test("multipart input accepts a real file but rejects SVG MIME and extra fields", async () => {
  const png = await sharp({create:{width:2,height:2,channels:3,background:"white"}}).png().toBuffer();
  const form = new FormData(); form.append("file", new File([new Uint8Array(png)], "photo.png", {type:"image/png"}));
  const result = await readUpload(new Request("https://site.test", {method:"POST", body:form}));
  assert.equal(result.file.name,"photo.png");
  form.append("extra", "not allowed");
  await assert.rejects(() => readUpload(new Request("https://site.test", {method:"POST",body:form})));
  const svg = new FormData(); svg.append("file", new File(["<svg />"],"image.svg",{type:"image/svg+xml"}));
  await assert.rejects(() => readUpload(new Request("https://site.test", {method:"POST",body:svg})));
});
