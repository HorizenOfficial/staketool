const shell = require('shelljs'); // eslint-disable-line import/no-extraneous-dependencies
const _ = require('lodash'); // eslint-disable-line import/no-extraneous-dependencies

const report = require('./report.json'); // eslint-disable-line import/no-unresolved

const advisoryURL = 'https://npmjs.com/advisories/';

const { actions, advisories } = report;
const advisoriesIds = [];

actions.forEach((action) => {
  action.resolves.forEach((resolve) => {
    if (resolve.dev !== true) {
      advisoriesIds.push(resolve.id);
    }
  });
});

const findings = _.flatten(
  Object.keys(advisories)
    .filter((key) => advisoriesIds.includes(parseInt(key, 10)))
    .map((advisoryKey) => {
      const advisory = advisories[advisoryKey];
      const advisoryFindings = advisory.findings;
      const refine = advisoryFindings.filter((find) => {
        const finds = find;
        finds.advisoryId = advisoryKey;
        finds.url = `${advisoryURL}${advisoryKey}`;
        finds.severity = advisory.severity;
        return finds.dev !== true;
      });
      return refine;
    }),
);

const highOrCriticalCount = findings.filter(({ severity }) => severity === 'high' || severity === 'critical').length;

shell.echo(
  `found ${
    findings.length
  } vulnerabilities among production dependencies. Please visit below link for details`,
);
shell.echo('--------------------');
findings.forEach((find) => {
  shell.echo(`URL: ${find.url}`);
  shell.echo(`Paths: \n- ${find.paths.join('\n')}`);
  shell.echo(`Severity: ${find.severity}`);
  shell.echo('--------------------');
});

shell.exec('rm -rf ./ci/scripts/report.json');

shell.exit(highOrCriticalCount > 0 ? 1 : 0);
