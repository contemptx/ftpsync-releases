import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPOSITORY, START, END, classifyRelease, fetchReleases, renderCatalogue, replaceCatalogue, refreshReadme } from './refresh-downloads.mjs';

let nextID = 1;
function release(version, { nas = false, published = '2026-11-28T01:00:00Z', draft = false } = {}) {
  const tag = `${nas ? 'nas-v' : 'v'}${version}`;
  const names = nas
    ? [`FTPSYNC-NAS-${version}-amd64.zip`, `FTPSYNC-NAS-${version}-arm64.zip`, 'SHA256SUMS']
    : [`FTPSYNC-${version}-windows-x86_64-Setup.exe`, `FTPSYNC-${version}-windows-x86_64.exe`, 'RELEASE_NOTES.txt', 'SHA256SUMS.txt', 'windows-x86_64.json'];
  return { id: nextID++, tag_name: tag, draft, prerelease: version.includes('-'), published_at: published,
    html_url: `https://github.com/${REPOSITORY}/releases/tag/${tag}`,
    assets: names.map(name => ({ name, state: 'uploaded', size: 1024, browser_download_url: `https://github.com/${REPOSITORY}/releases/download/${tag}/${name}` })) };
}
const fixtures = () => [release('0.22.2'), release('0.22.0-rc.58'), release('0.22.0-rc.49', { nas: true })];

test('current channels use numeric SemVer; recent five use publication order and exclude feeds/NAS/drafts/incomplete uploads', () => {
  const windows = [
    release('0.22.0-rc.9', { published: '2026-11-28T09:00:00Z' }),
    release('0.22.0-rc.10', { published: '2026-11-28T08:00:00Z' }),
    release('0.22.2', { published: '2026-11-28T07:00:00Z' }),
    release('0.22.10', { published: '2026-11-28T06:00:00Z' }),
    release('0.22.1', { published: '2026-11-28T05:00:00Z' }),
    release('0.22.0', { published: '2026-11-28T04:00:00Z' }),
  ];
  const incomplete = release('9.0.0'); incomplete.assets.pop();
  const feed = { ...release('8.0.0'), tag_name: 'stable-feed' };
  const output = renderCatalogue([...windows.reverse(), release('0.22.0-rc.49', { nas: true }), release('10.0.0', { draft: true }), incomplete, feed]);
  assert.match(output, /Windows Stable \| 0\.22\.10/);
  assert.match(output, /Windows Preview \/ beta \| 0\.22\.0-rc\.10/);
  const recent = output.split('### Latest five Windows releases')[1];
  const versions = [...recent.matchAll(/^\| \[([^\]]+)\]/gm)].map(match => match[1]);
  assert.deepEqual(versions, ['0.22.0-rc.9', '0.22.0-rc.10', '0.22.2', '0.22.10', '0.22.1']);
  assert.doesNotMatch(output, /9\.0\.0|10\.0\.0|stable-feed/);
});

test('release and asset identities reject wrong hosts/repos/tags, missing architectures, duplicate names and incomplete uploads', () => {
  for (const alter of [
    r => { r.tag_name = 123; },
    r => { r.html_url = r.html_url.replace('github.com', 'example.com'); },
    r => { r.assets[0].browser_download_url = r.assets[0].browser_download_url.replace(REPOSITORY, 'other/repo'); },
    r => { r.assets[0].browser_download_url += '?redirect=https://example.com'; },
    r => { r.assets[0].name = 'FTPSYNC-0.21.0-windows-x86_64-Setup.exe'; },
    r => { r.assets.push({ ...r.assets[0] }); },
    r => { r.assets[0].state = 'starter'; },
    r => { r.assets[0].size = 0; },
    r => { r.prerelease = true; },
    r => { r.published_at = 'invalid'; },
  ]) { const item = release('0.22.2'); alter(item); assert.equal(classifyRelease(item), null); }
  const nas = release('0.22.0-rc.49', { nas: true }); nas.assets.splice(1, 1);
  assert.equal(classifyRelease(nas), null);
});

test('pagination uses only the fixed GitHub API URL and fails on HTTP errors or repeated pages', async () => {
  const pages = [Array.from({ length: 100 }, () => release('0.22.0')), [release('0.22.2')]];
  const calls = [];
  const values = await fetchReleases({ token: 'fixture-token', fetchImpl: async (url, options) => {
    calls.push({ url, options }); return { ok: true, json: async () => pages[calls.length - 1] };
  } });
  assert.equal(values.length, 101);
  assert.deepEqual(calls.map(call => call.url), [1, 2].map(page => `https://api.github.com/repos/${REPOSITORY}/releases?per_page=100&page=${page}`));
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer fixture-token');
  await assert.rejects(fetchReleases({ fetchImpl: async () => ({ ok: false, status: 403 }) }), /HTTP 403/);
  await assert.rejects(fetchReleases({ fetchImpl: async () => ({ ok: true, json: async () => pages[0] }) }), /repeated release ID/);
});

test('only the marked region changes; missing/duplicate markers and absent complete channels preserve the file', async () => {
  const original = `Introduction\n${START}\nOld list\n${END}\nCustomer licensing guidance\n`;
  const rendered = renderCatalogue(fixtures());
  const updated = replaceCatalogue(original, rendered);
  assert.ok(updated.startsWith(`Introduction\n${START}\n`));
  assert.ok(updated.endsWith(`${END}\nCustomer licensing guidance\n`));
  assert.equal(replaceCatalogue(updated, rendered), updated);
  assert.throws(() => replaceCatalogue('No markers', rendered), /exactly one/);
  assert.throws(() => replaceCatalogue(original + START, rendered), /exactly one/);
  const directory = await mkdtemp(join(tmpdir(), 'ftpsync-downloads-'));
  try {
    const file = join(directory, 'README.md'); await writeFile(file, original);
    await assert.rejects(refreshReadme({ file, releases: [release('0.22.2')] }), /complete Stable, Preview and Docker/);
    assert.equal(await readFile(file, 'utf8'), original);
    assert.equal(await refreshReadme({ file, releases: fixtures() }), true);
    assert.equal(await refreshReadme({ file, releases: fixtures() }), false);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
