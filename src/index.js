const core = require('@actions/core')
  , installer = require('./installer')
  ;

async function run() {
  try {
    const version = core.getInput('detekt_version') || '*'
      , token = core.getInput('token', { required: true })
      , addToPath = core.getInput('add_to_path') || false
      ;

    const detektPath = await installer.getDetekt(version, token);
    if (addToPath === 'true') {
      core.info('Adding detekt to PATH.');
      core.addPath(detektPath);
    }

    core.setOutput('detekt', detektPath);

  } catch (err) {
    core.setFailed(err.message);
    console.error(err.stack)
  }
}

run();