const tc = require('@actions/tool-cache')
  , core = require('@actions/core')
  , github = require('@actions/github')
  , semver = require('semver')
  , fs = require('fs').promises
;

const OWNER = 'detekt';
const REPO = 'detekt';

module.exports.getDetekt = async (versionSpec, token) => {
  let toolPath = tc.find('detekt', versionSpec);

  if (toolPath) {
    core.info(`Found detekt in tool cache at '${toolPath}'`);
  } else {
    core.info(`Attempting to resolve and download detekt version ${versionSpec}`);

    const releases = await getReleaseVersions(token);
    const matched = matchVersion(releases, versionSpec);

    if (matched.length === 0) {
      core.setFailed(`Unable to resolve specified version of detekt: ${versionSpec}`);
      return;
    }

    //TODO may have multiple versions, if so need to select the latest of the matches
    core.info(`Matched versions:`);
    matched.forEach(release => {
      core.info(`  ${release.version}`);
    });

    const release = matched[0];
    const url = release.detekt.url;

    core.info(`Downloading detekt from ${url}`);
    const downloadPath = await tc.downloadTool(url);
    // Need to ensure it is executable as the releases are missing the execution bit on them.
    await fs.chmod(downloadPath, 0o755);

    core.info(`Adding to cache`);
    toolPath = await tc.cacheFile(downloadPath, 'detekt', 'detekt', release.version);
    core.info('Done');
  }

  return toolPath;
}

function matchVersion(releases, versionSpec) {
  const matched = [];
  releases.forEach(release => {
    if (semver.satisfies(release.version, versionSpec)) {
      matched.push(release);
    }
  });
  return matched;
}

async function getReleaseVersions(token) {
  const octokit = github.getOctokit(token);

  const releases = await octokit.paginate(
    'GET /repos/{owner}/{repo}/releases',
    {
      owner: OWNER,
      repo: REPO
    })
    .then(releaseData => {
      // Filter releases to ones that include the detekt all in one executable
      const releases =  releaseData.map(data => new DetektRelease(data));
      return releases.filter(release => !!release.detekt)
    });

  core.debug(`Resovled Releases for ${OWNER}/${REPO}`);
  releases.forEach(release => {
    core.debug(`  ${release.tag}:${release.name}`);
    core.debug(`    published: ${release.published}`);
    core.debug(`    stable: ${release.stable}`);
  });

  return releases;
}


class DetektRelease {

  constructor(data) {
    this.data = data;
  }

  get version() {
    return this.tag;
  }

  get tag() {
    return this.data.tag_name;
  }

  get name() {
    return this.data.name
  }

  get stable() {
    return !this.isPrerelease && !this.isDraft;
  }

  get isDraft() {
    return this.data.draft;
  }

  get isPrerelease() {
    return this.data.prerelease;
  }

  get published() {
    return this.data.published_at
  }

  get detekt() {
    return this.files['detekt'];
  }

  get files() {
    const files = {};

    if (this.data.assets) {
      this.data.assets.forEach(asset => {
        files[asset.name] = {
          url: asset.browser_download_url,
          name: asset.name,
          // label: asset.label,
          content_type: asset.content_type
        }
      });
    }

    return files;
  }
}