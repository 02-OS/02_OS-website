// The button always follows the newest GitHub release. A new tag does not
// need a change to this page. The download starts when the button is clicked.
const RELEASES = "https://api.github.com/repos/csy20/02_OS/releases/latest";
const queued = [];

function startDownload(url) {
  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.src = url;
  document.body.append(frame);
}

function isoName(parts) {
  const first = parts[0]?.name ?? "";
  return first.replace(/\.part[a-z]+$/, "");
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

async function showLatest() {
  const button = document.querySelector("#download");
  const buttonLabel = button?.querySelector(".btn-label") || button;
  const status = document.querySelector("#release-status");
  const join = document.querySelector("#join");
  const files = document.querySelector("#files");
  const filesCount = document.querySelector("#files-count");
  try {
    const response = await fetch(RELEASES);
    if (!response.ok) throw new Error(String(response.status));
    const release = await response.json();
    const assets = release.assets ?? [];
    const whole = assets.find((asset) => asset.name.endsWith(".iso"));
    const parts = assets
      .filter((asset) => /\.iso\.part/.test(asset.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    const tag = release.tag_name || "the latest release";
    const downloads = whole ? [whole] : parts;
    const checks = assets.filter((asset) => asset.name.endsWith(".sha256"));
    queued.splice(0, queued.length, ...downloads, ...checks);

    if (buttonLabel) buttonLabel.textContent = `Download ${tag}`;
    if (button) button.href = downloads[0]?.browser_download_url || release.html_url;
    if (filesCount) filesCount.textContent = `${tag} · ${assets.length} files`;

    status.textContent = downloads.length
      ? `${tag} is the latest image. The button starts saving ${downloads.length === 1 ? "that file" : `all ${downloads.length} parts`} and the checksum files.`
      : `${tag} has no image file yet.`;

    if (parts.length) {
      const name = isoName(parts);
      join.textContent = `cat ${name}.part* > ${name}\nsha256sum -c 02_OS.sha256`;
    } else if (whole) {
      join.textContent = `sha256sum -c 02_OS.sha256`;
    }

    files.replaceChildren();
    for (const asset of assets) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = asset.browser_download_url;
      link.textContent = asset.name;

      const meta = document.createElement("span");
      meta.className = "file-meta";
      const kind = asset.name.endsWith(".sha256")
        ? "SHA-256"
        : /\.iso\.part/.test(asset.name)
          ? "ISO part"
          : asset.name.endsWith(".iso")
            ? "ISO"
            : "File";
      const size = formatBytes(asset.size);
      meta.textContent = size ? `${kind} · ${size}` : kind;

      item.append(link, meta);
      files.append(item);
    }
  } catch {
    status.textContent = "The latest release could not be read just now. The button still opens the newest GitHub release.";
  }
}

document.querySelector("#download")?.addEventListener("click", (event) => {
  if (!queued.length) return;
  event.preventDefault();
  for (const asset of queued) startDownload(asset.browser_download_url);
});

document.querySelector("#copy-join")?.addEventListener("click", async (event) => {
  const btn = event.currentTarget;
  const join = document.querySelector("#join");
  if (!join) return;
  try {
    await navigator.clipboard.writeText(join.textContent.trim());
    const prev = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => {
      btn.textContent = prev;
    }, 1500);
  } catch {}
});

showLatest();
