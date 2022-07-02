const chai = require('chai');
const os = require('os');
const installer = require('./installer');

chai.use(require('chai-string'));
const expect = chai.expect;

describe('Detekt installer', () => {

  describe('#getDetekt()', function () {

    this.timeout(10000);

    beforeEach(async () => {
      process.env.RUNNER_TOOL_CACHE = os.tmpdir();
      process.env.RUNNER_TEMP = os.tmpdir();
    })

    it('should get version 1.18', async () => {
      const toolpath = await installer.getDetekt('1.18', testToken());
      console.log(toolpath);
      expect(toolpath).to.include('1.18');
      expect(toolpath).to.endsWith('bin');
    });

    it('should get version 1.20.0', async () => {
      const toolpath = await installer.getDetekt('1.20', testToken());
      console.log(toolpath);
      expect(toolpath).to.include('1.20');
      expect(toolpath).to.endsWith('bin');
    });
  });

  describe('#getReleaseVersions()', function() {

    this.timeout(10000);

    it('should get all valid releases', async () => {
      const releases = await installer.getReleaseVersions(testToken());
      expect(releases).to.have.length.greaterThan(10);
    });

    it('should identify version 1.20.0 as a cli version', async () => {
      const releases = await installer.getReleaseVersions(testToken());

      const matched = releases.filter(release => release.version === '1.20.0');
      expect(matched).to.have.length(1);
      expect(matched[0]).to.have.property('version').to.equal('1.20.0');
      expect(matched[0].detekt).to.be.undefined;
      expect(matched[0].detektCli).to.have.property('name').to.equal('detekt-cli-1.20.0.zip');
    });
  });
});


function testToken() {
  return process.env.GITHUB_TOKEN;
}