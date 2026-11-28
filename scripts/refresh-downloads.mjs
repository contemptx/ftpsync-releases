import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const REPOSITORY = 'contemptx/ftpsync-releases';
export const START = '<!-- FTPSYNC-DOWNLOADS:START -->';
export const END = '<!-- FTPSYNC-DOWNLOADS:END -->';
const API = `https://api.github.com/repos/${REPOSITORY}/releases`;
const WEB = `https://github.com/${REPOSITORY}/releases`;

function versionOf(tag, prefix) {
  if (typeof tag !== 'string' || !tag.startsWith(prefix)) return null;
  const value = tag.slice(prefix.length);
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(value);
  if (!match) return null;
  const core = match.slice(1, 4).map(Number);
  const pre = match[4]?.split('.') ?? [];
  if (!core.every(Number.isSafeInteger) || pre.some(id => /^\d+$/.test(id) && (!Number.isSafeInteger(Number(id)) || (id.length > 1 && id[0] === '0')))) return null;
  return { value, core, pre };
}

// Numeric SemVer ordering keeps rc.10 newer than rc.9 and Stable above its RCs.
export function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) if (a.core[i] !== b.core[i]) return a.core[i] > b.core[i] ? 1 : -1;
  if (!a.pre.length || !b.pre.length) return Number(!a.pre.length) - Number(!b.pre.length);
  for (let i = 0; i < Math.max(a.pre.length, b.pre.length); i++) {
    if (a.pre[i] === undefined) return -1;
    if (b.pre[i] === undefined) return 1;
    if (a.pre[i] === b.pre[i]) continue;
    const an = /^\d+$/.test(a.pre[i]), bn = /^\d+$/.test(b.pre[i]);
    if (an && bn) return Number(a.pre[i]) > Number(b.pre[i]) ? 1 : -1;
    if (an !== bn) return an ? -1 : 1;
    return a.pre[i] > b.pre[i] ? 1 : -1;
  }
  return 0;
}

function assetURL(tag, name) {
  return `${WEB}/download/${tag}/${name}`;
}

function hasAsset(release, name) {
  const matches = release.assets.filter(asset => asset?.name === name);
  return matches.length === 1 && matches[0].state === 'uploaded'
    && Number.isSafeInteger(matches[0].size) && matches[0].size > 0
    && matches[0].browser_download_url === assetURL(release.tag_name, name);
}

export function classifyRelease(release) {
  if (!release || release.draft !== false || typeof release.tag_name !== 'string' || !Array.isArray(release.assets)
    || typeof release.published_at !== 'string' || !Number.isFinite(Date.parse(release.published_at))) return null;
  const kind = release.tag_name?.startsWith('nas-v') ? 'nas' : 'windows';
  const version = versionOf(release.tag_name, kind === 'nas' ? 'nas-v' : 'v');
  if (!version || release.prerelease !== Boolean(version.pre.length)
    || release.html_url !== `${WEB}/tag/${release.tag_name}`) return null;
  const stem = `FTPSYNC-${version.value}-windows-x86_64`;
  let required;
  if (kind === 'windows') {
    required = [`${stem}-Setup.exe`, `${stem}.exe`, 'RELEASE_NOTES.txt', 'SHA256SUMS.txt', 'windows-x86_64.json'];
  } else {
    // The first public NAS bundle used lowercase names; both contracts are exact.
    const upper = ['amd64', 'arm64'].map(arch => `FTPSYNC-NAS-${version.value}-${arch}.zip`);
    const lower = ['amd64', 'arm64'].map(arch => `ftpsync-nas-${version.value}-${arch}.zip`);
    required = [...(upper.every(name => hasAsset(release, name)) ? upper : lower), 'SHA256SUMS'];
  }
  if (!required.every(name => hasAsset(release, name))) return null;
  return { release, kind, version, required };
}

export async function fetchReleases({ fetchImpl = fetch, token = process.env.GITHUB_TOKEN } = {}) {
  const all = [], ids = new Set();
  for (let page = 1; ; page++) {
    // Build each page URL locally: never forward the token through Link headers or redirects.
    const response = await fetchImpl(`${API}?per_page=100&page=${page}`, {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      redirect: 'error', signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`GitHub release listing failed: HTTP ${response.status}`);
    const releases = await response.json();
    if (!Array.isArray(releases) || releases.length > 100) throw new Error('Invalid GitHub release-list response');
    for (const release of releases) {
      if (!Number.isSafeInteger(release?.id) || ids.has(release.id)) throw new Error('Invalid or repeated release ID during pagination');
      ids.add(release.id); all.push(release);
    }
    if (releases.length < 100) return all;
  }
}

const date = value => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));

export function renderCatalogue(releases) {
  const complete = releases.map(classifyRelease).filter(Boolean);
  const windows = complete.filter(item => item.kind === 'windows');
  const latest = items => items.sort((a, b) => compareVersions(b.version, a.version) || Date.parse(b.release.published_at) - Date.parse(a.release.published_at))[0];
  const stable = latest(windows.filter(item => !item.version.pre.length));
  const preview = latest(windows.filter(item => item.version.pre.length));
  const nas = latest(complete.filter(item => item.kind === 'nas'));
  if (!stable || !preview || !nas) throw new Error('A complete Stable, Preview and Docker/NAS release is required; README left unchanged');
  const rows = [
    '| Edition | Current version | Published | Download |',
    '| --- | --- | --- | --- |',
    ...[[stable, 'Windows Stable'], [preview, 'Windows Preview / beta']].map(([item, label]) => `| ${label} | ${item.version.value} | ${date(item.release.published_at)} | [Windows installer](${assetURL(item.release.tag_name, item.required[0])}) · [Release notes](${item.release.html_url}) |`),
    `| Docker / NAS${nas.version.pre.length ? ' Preview' : ''} | ${nas.version.value} | ${date(nas.release.published_at)} | [amd64 bundle](${assetURL(nas.release.tag_name, nas.required[0])}) · [arm64 bundle](${assetURL(nas.release.tag_name, nas.required[1])}) · [Setup instructions](https://ftpsync.io/docker) |`,
    '', '### Latest five Windows releases', '',
    '| Version | Channel | Published |', '| --- | --- | --- |',
    ...[...windows].sort((a, b) => Date.parse(b.release.published_at) - Date.parse(a.release.published_at) || compareVersions(b.version, a.version)).slice(0, 5)
      .map(item => `| [${item.version.value}](${item.release.html_url}) | ${item.version.pre.length ? 'Preview / beta' : 'Stable'} | ${date(item.release.published_at)} |`),
    '', `[Full release archive](${WEB})`,
  ];
  return rows.join('\n');
}

export function replaceCatalogue(readme, catalogue) {
  if (readme.split(START).length !== 2 || readme.split(END).length !== 2 || readme.indexOf(END) < readme.indexOf(START)) throw new Error('README must contain exactly one ordered download region');
  const start = readme.indexOf(START) + START.length, end = readme.indexOf(END);
  return `${readme.slice(0, start)}\n${catalogue}\n${readme.slice(end)}`;
}

export async function refreshReadme({ file = new URL('../README.md', import.meta.url), releases } = {}) {
  const before = await readFile(file, 'utf8');
  const after = replaceCatalogue(before, renderCatalogue(releases ?? await fetchReleases()));
  if (after === before) return false;
  await writeFile(file, after, 'utf8');
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(await refreshReadme() ? 'Updated README download catalogue.' : 'README download catalogue is current.'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
