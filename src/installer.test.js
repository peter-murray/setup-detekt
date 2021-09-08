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
  });

  describe('#getReleaseVersions()', () => {

    it('should get all valid releases', async () => {
      const releases = await installer.getReleaseVersions(testToken());
      expect(releases).to.have.length.greaterThan(10);
    });
  });
});


function testToken() {
  return process.env.GITHUB_TOKEN;
}