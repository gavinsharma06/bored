// A tiny client for the GitHub Contents API, used to read and write JSON files in
// the private data repo. The token only ever travels in the Authorization header:
// it never goes in a URL, a log line, or an error message.
const githubApi = (() => {
  const API = "https://api.github.com";
  const DEFAULT_REPO = "Demented-Diablo/bored-data";
  const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;

  function settings() {
    return {
      token: storage.load("githubToken", ""),
      repo: storage.load("githubRepo", "") || DEFAULT_REPO
    };
  }

  function isValidRepo(repo) {
    return REPO_PATTERN.test(repo);
  }

  function isConfigured() {
    const { token, repo } = settings();
    return Boolean(token) && isValidRepo(repo);
  }

  function saveSettings({ token, repo }) {
    storage.save("githubToken", token);
    storage.save("githubRepo", repo);
  }

  function forgetToken() {
    storage.remove("githubToken");
  }

  function toBase64(text) {
    const bytes = new TextEncoder().encode(text);
    return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
  }

  function fromBase64(encoded) {
    const binary = atob(encoded.replace(/\s/g, ""));
    return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  }

  // Errors carry the file name and status only, so nothing sensitive ends up in logs.
  async function request(path, { method = "GET", body } = {}) {
    const { token, repo } = settings();
    const response = await fetch(`${API}/repos/${repo}/contents/${path}`, {
      method,
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
        ...(body ? { "content-type": "application/json" } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok && response.status !== 404) {
      const error = new Error(`GitHub answered ${response.status} for ${path}`);
      error.status = response.status;
      throw error;
    }

    return response.status === 404 ? null : response.json();
  }

  // File contents are parsed with JSON.parse only, so nothing from the repo is ever
  // run. Parse errors can quote the file, so they're replaced with a plain message.
  async function readJson(path) {
    const file = await request(path);

    if (!file) {
      return { value: null, sha: null };
    }

    try {
      return { value: JSON.parse(fromBase64(file.content)), sha: file.sha };
    } catch {
      throw new Error(`${path} is not valid JSON`);
    }
  }

  async function writeText(path, text, sha, message) {
    await request(path, {
      method: "PUT",
      body: { message, content: toBase64(text), ...(sha ? { sha } : {}) }
    });
  }

  return { DEFAULT_REPO, settings, isValidRepo, isConfigured, saveSettings, forgetToken, readJson, writeText };
})();
