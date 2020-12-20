const tc = require('@actions/tool-cache')
  , core = require('@actions/core')
;

module.exports.getDetekt = async (version, token) => {
  let toolPath = tc.find('detekt', version);

  if (toolPath) {
    core.info(`Found detekt in tool cache at '${toolPath}'`);
  } else {
    core.info(`Attempting to download detekt version ${version}`);

    const downloadPath = await getDownloadUrlFromRepo(version, token);
    core.info(`DOWNLOAD PATH: ${downloadPath}`);
  }
}

async function getDownloadUrlFromRepo(version, token) {
  const owner = 'detekt'
    , repo = 'detekt'
    , branch = 'master'
    , stable = false
  ;

  const releases = await tc.getManifestFromRepo(owner, repo, token, branch);
  const release = await tc.findFromManifest(version, stable, releases);
  if (release) {
    core.info(`Found release ${version}`);

    if (release.files.length > 0) {
      core.info(`Files for release: ${JSON.stringify(release.files, null, 2)}`);
      return release.files[0];
    }
  }
  return undefined;
}