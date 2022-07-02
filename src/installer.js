const tc = require('@actions/tool-cache')
  , core = require('@actions/core')
  , github = require('@actions/github')
  , semver = require('semver')
  , fs = require('fs').promises
  , path = require('path')
  ;

const OWNER = 'detekt';
const REPO = 'detekt';

module.exports.getDetekt = async function getDetekt(versionSpec, token) {
  let toolPath = tc.find('detekt', versionSpec, 'all');
  if (!toolPath) {
    // Try to resolve the CLI variant
    toolPath = tc.find('detekt-cli', versionSpec, 'all');
    if (toolPath) {
      toolPath = path.join(toolPath, 'bin');
    }
  }

  if (toolPath) {
    core.info(`Found detekt in tool cache at '${toolPath}'`);
  } else {
    core.info(`Attempting to resolve and download detekt version ${versionSpec}`);

    const releases = await this.getReleaseVersions(token);
    const release = matchVersion(releases, versionSpec);

    if (!release) {
      core.setFailed(`Unable to resolve specified version of detekt: ${versionSpec}`);
      return;
    }

    if (release.detekt) {
      const url = release.detekt.url;
      core.info(`Downloading detekt binary from ${url}`);
      const downloadPath = await tc.downloadTool(url);

      // Ensure that if we have the executable version of the release, the execution bit is set
      await fs.chmod(downloadPath, 0o755);
      core.info(`Adding detekt binary to cache`);
      toolPath = await tc.cacheFile(downloadPath, 'detekt', 'detekt', release.version, 'all');

    } else if (release.detektCli) {
      const url = release.detektCli.url;
      core.info(`Downloading detekt-cli from ${url}`);
      const downloadPath = await tc.downloadTool(url);

      const extractedDir = await tc.extractZip(downloadPath);
      core.info(`Adding detekt-cli directory to cache`);
      toolPath = await tc.cacheDir(extractedDir, 'detekt-cli', release.version, 'all');
      // The tool has a top level directory that inlcludes the version number with out 'v'
      toolPath = path.join(toolPath, `detekt-cli-${release.version}`, 'bin');
    } else {
      throw new Error(`Unknown type of detekt tool type, currently unsupported variant`);
    }
    core.info('Done');
  }

  return toolPath;
}

function matchVersion(releases, versionSpec) {
  const matched = {}
    , versions = []
    ;

  releases.forEach(release => {
    if (semver.satisfies(release.version, versionSpec)) {
      versions.push(release.version);
      matched[release.version] = release;
    }
  });
  const maxVersion = semver.maxSatisfying(versions, versionSpec);

  core.info(`Matched: ${JSON.stringify(Object.keys(matched), null, 2)}`);
  core.info(`Versions: ${JSON.stringify(versions, null, 2)}`);
  core.info(`maxVersion: ${maxVersion}`);

  if (maxVersion) {
    const result = matched[maxVersion];
    core.info(`Result: ${JSON.stringify(result)}`);
    return result;
  }
  return undefined;
}

module.exports.getReleaseVersions = async function getReleaseVersions(token) {
  const octokit = github.getOctokit(token);

  const releases = await octokit.paginate(
    'GET /repos/{owner}/{repo}/releases',
    {
      owner: OWNER,
      repo: REPO
    })
    .then(releaseData => {
      // Filter releases to ones that include the detekt all in one executable
      const releases = releaseData.map(data => new DetektRelease(data));
      return releases.filter(release => {
        return release.detekt !== undefined || release.detektCli !== undefined
      });
    });

  core.startGroup(`Resolved releases for ${OWNER}/${REPO}`);
  releases.forEach(release => {
    core.info(`  ${release.tag}:${release.name}`);
    core.info(`    published: ${release.published}`);
    core.info(`    stable: ${release.stable}`);
  });

  return releases;
}

class DetektRelease {

  constructor(data) {
    this.data = data;
  }

  get version() {
    return this.tag[0] === 'v' ? this.tag.substring(1) : this.tag;
  }

  get tag() {
    return this.data.tag_name;
  }

  get name() {
    return this.data.name;
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
    return this.data.published_at;
  }

  get detekt() {
    // v1.15.0 and earlier
    return this.files['detekt'];
  }

  get detektCli() {
    const filenameRegex = /detekt-cli.*\.zip/;
    let bundle = undefined;

    Object.keys(this.files).forEach(name => {
      const match = filenameRegex.exec(name);
      if (match) {
        bundle = this.files[name];
      }
    });

    return bundle;
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

