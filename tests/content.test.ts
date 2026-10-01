import { test } from "node:test";
import assert from "node:assert/strict";
import { getDefaultContent } from "../src/lib/default-content";
import { isSafeImageSource, parseContentSnapshot, parseSiteContent } from "../src/lib/content-validation";
import { assertSameOrigin, readLimitedBody } from "../src/lib/server/http";

test("initial content validates and preserves all construction steps", () => {
  const result = parseContentSnapshot({ content: getDefaultContent(), revision: 0 });
  assert.equal(result.content.steps.length, 6);
  assert.equal(result.content.firmwareUrl, null);
});

test("image sources reject external hosts, SVG, traversal and credentials", () => {
  const origin = "https://project.supabase.co";
  assert.equal(isSafeImageSource(`${origin}/storage/v1/object/public/drone-images/user/photo.webp`, origin), true);
  for (const src of ["https://other.test/photo.webp", "/images/../photo.png", "/images/a.svg", "javascript:alert(1)", `${origin}/storage/v1/object/public/drone-images/user/%2e%2e/a.webp`, "https://me:password@project.supabase.co/storage/v1/object/public/drone-images/a.webp"]) {
    assert.equal(isSafeImageSource(src, origin), false, src);
  }
});

test("duplicates, invalid hero references and unsafe firmware links fail", () => {
  const duplicate = getDefaultContent(); duplicate.components.push(duplicate.components[0]);
  assert.throws(() => parseSiteContent(duplicate), /duplicat/);
  const hero = getDefaultContent(); hero.heroImageId = "missing";
  assert.throws(() => parseSiteContent(hero), /galerie/);
  const content = getDefaultContent(); content.firmwareUrl = "javascript:alert(1)";
  assert.throws(() => parseSiteContent(content), /HTTPS/);
  content.firmwareUrl = "https://github.com/example/firmware";
  assert.equal(parseSiteContent(content).firmwareUrl, content.firmwareUrl);
});

test("untrusted markup in code remains literal text", () => {
  const content = getDefaultContent();
  content.codeFiles.push({id:"code-1",title:"Snippet",filename:"main.ino",language:"cpp",description:"",content:'<script>alert("x")</script>'});
  assert.equal(parseSiteContent(content).codeFiles[0].content, content.codeFiles[0].content);
});

test("invalid revisions and content bounds are rejected", () => {
  for(const revision of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, "1"]) assert.throws(() => parseContentSnapshot({content:getDefaultContent(), revision}));
  const oversized = getDefaultContent(); oversized.steps[0].title = "a".repeat(201);
  assert.throws(() => parseSiteContent(oversized));
});

test("mutations require the same origin", () => {
  assert.doesNotThrow(() => assertSameOrigin(new Request("https://site.test/api/admin/content", {headers:{origin:"https://site.test","sec-fetch-site":"same-origin"}})));
  assert.throws(() => assertSameOrigin(new Request("https://site.test/api/admin/content", {headers:{origin:"https://attacker.test"}})));
  assert.throws(() => assertSameOrigin(new Request("https://site.test/api/admin/content")));
  assert.doesNotThrow(() => assertSameOrigin(new Request("http://localhost:3000/api/admin/login", {headers:{host:"127.0.0.1:3000",origin:"http://127.0.0.1:3000","sec-fetch-site":"same-origin"}})));
  assert.throws(() => assertSameOrigin(new Request("http://localhost:3000/api/admin/login", {headers:{host:"site.test",origin:"https://attacker.test","x-forwarded-host":"attacker.test"}})));
  assert.throws(() => assertSameOrigin(new Request("https://site.test/api/admin/login", {headers:{host:"site.test",origin:"http://site.test","sec-fetch-site":"same-site"}})));
});

test("stream size is limited even without a content-length header", async () => {
  await assert.rejects(() => readLimitedBody(new Request("https://site.test", {method:"POST",body:"abcdef"}), 3));
});
