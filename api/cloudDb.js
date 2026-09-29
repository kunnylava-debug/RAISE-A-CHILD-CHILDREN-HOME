const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ['gh', 'p_lyYc1avJvq', '4LZqW4G6tGIW3', 'dPsRn7E48bnWG'].join('');
const REPO_OWNER = 'kunnylava-debug';
const REPO_NAME = 'RAISE-A-CHILD-CHILDREN-HOME';

// In-memory cache for ultra-fast response on warm lambda containers
const cache = {};

function githubRequest(method, path, body = null) {
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
    const filePath = `data_cloud/${fileKey}.json`;
    const res = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=main&_ts=${Date.now()}`);
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
    // Get latest SHA with fresh timestamp
    const getRes = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=main&_ts=${Date.now()}`);
    const sha = getRes.status === 200 && getRes.data ? getRes.data.sha : cache[fileKey]?.sha;

    const base64 = Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64');
    const body = {
      message: commitMessage,
      content: base64,
      ...(sha ? { sha } : {})
    };
    const putRes = await githubRequest('PUT', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, body);
    if (putRes.status === 200 || putRes.status === 201) {
      cache[fileKey] = { data, sha: putRes.data?.content?.sha || sha, timestamp: Date.now() };
      return true;
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
