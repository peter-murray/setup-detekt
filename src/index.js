const core = require('@actions/core')
  , installer = require('./installer')
;

async function run() {
  try {
    const version = core.getInput('detekt_version', {required: true})
      , token = core.getInput('token', {required: true});

    await installer.getDetekt(version, token);

  } catch (err) {
    core.setFailed(err.message);
  }
}

run();