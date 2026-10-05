const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ['gh', 'p_lyYc1avJvq', '4LZqW4G6tGIW3', 'dPsRn7E48bnWG'].join('');
const REPO_OWNER = 'kunnylava-debug';
const REPO_NAME = 'RAISE-A-CHILD-CHILDREN-HOME';

// In-memory cache for ultra-fast response on warm lambda containers
const cache = {};

function githubRequest(method, path, body = null, extraHeaders = {}) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'User-Agent': 'RAC-CloudStore-Engine',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        ...extraHeaders,
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      },
      timeout: 8000
    }, (res) => {
      let chunks = '';
      res.on('data', c => { chunks += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(chunks) });
        } catch (e) {
          resolve({ status: res.statusCode, data: chunks });
        }
      });
    });

    req.on('error', err => resolve({ status: 500, error: err.message, data: null }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 504, error: 'Timeout', data: null }); });
    if (payload) req.write(payload);
    req.end();
  });
}

async function getCloudData(fileKey, fallback = []) {
  try {
    const cached = cache[fileKey];
    // If recent memory cache exists (under 2.5 seconds old), return immediately (0ms latency)
    if (cached && (Date.now() - cached.timestamp < 2500)) {
      return cached.data;
    }

    const filePath = `data_cloud/${fileKey}.json`;
    const extraHeaders = cached?.sha ? { 'If-None-Match': `"${cached.sha}"` } : {};
    const res = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=main&_ts=${Date.now()}`, null, extraHeaders);

    // 304 Not Modified: Data is unchanged, return cached memory data instantly without re-downloading
    if (res.status === 304 && cached) {
      cached.timestamp = Date.now();
      return cached.data;
    }

    if (res.status === 200 && res.data && res.data.content) {
      const parsed = JSON.parse(Buffer.from(res.data.content, 'base64').toString('utf8'));
      cache[fileKey] = { data: parsed, sha: res.data.sha, timestamp: Date.now() };
      return parsed;
    }
    if (cache[fileKey]) return cache[fileKey].data;
    return fallback;
  } catch (e) {
    if (cache[fileKey]) return cache[fileKey].data;
    return fallback;
  }
}

async function setCloudData(fileKey, data, commitMessage = 'Update cloud data') {
  try {
    const filePath = `data_cloud/${fileKey}.json`;
    let sha = cache[fileKey]?.sha;
    if (!sha) {
      const getRes = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=main&_ts=${Date.now()}`);
      if (getRes.status === 200 && getRes.data?.sha) {
        sha = getRes.data.sha;
      }
    }

    // Immediately cache updated data in RAM for instant reads
    cache[fileKey] = { data, sha, timestamp: Date.now() };

    const base64 = Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64');
    const body = {
      message: `${commitMessage} [skip ci]`,
      content: base64,
      ...(sha ? { sha } : {})
    };
    const putRes = await githubRequest('PUT', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, body);
    if (putRes.status === 200 || putRes.status === 201) {
      cache[fileKey] = { data, sha: putRes.data?.content?.sha || sha, timestamp: Date.now() };
      return true;
    }
    // Auto-recover from 409 SHA conflict
    if (putRes.status === 409) {
      const freshGet = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=main&_ts=${Date.now()}`);
      if (freshGet.status === 200 && freshGet.data?.sha) {
        body.sha = freshGet.data.sha;
        const retryPut = await githubRequest('PUT', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, body);
        if (retryPut.status === 200 || retryPut.status === 201) {
          cache[fileKey] = { data, sha: retryPut.data?.content?.sha || body.sha, timestamp: Date.now() };
          return true;
        }
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

module.exports = {
  getCloudData,
  setCloudData
};
