
var getRepoInfo = require('git-repo-info');
var GitlabApi = require('gitlab');
var GitHubApi = require('github');
var Promise = require('bluebird');
var fs = require('fs');
var semver = require('semver');
var github, gitlab;

/**
 * Setup the Github and Gitlab API helper objects and authenticate them.
 *
 * @param {String} github_token The Github access token.
 * @param {String} gitlab_token The Gitlab access token.
 */
exports.setupGitApi = function setupGitApi(github_token, gitlab_token) {
  gitlab = new GitlabApi({
    url: 'https://git.handsontable.com/',
    token: gitlab_token
  });

  github = new GitHubApi({
    version: '3.0.0',
    timeout: 5000,
    headers: {
      'user-agent': 'Handsontable'
    }
  });

  github.authenticate({
    type: 'oauth',
    token: github_token
  });
};

/**
 * Get information about local repository.
 *
 * @returns {Object}
 */
exports.getLocalInfo = function getLocalInfo() {
  return getRepoInfo();
};

/**
 * Get latest Handsontable release version based on passed semver range.
 *
 * @param {String} [range=false] Semver range version
 * @returns {Promise}
 */
exports.getHotLatestRelease = function getHotLatestRelease(range) {
  return new Promise(function(resolve, reject) {

    gitlab.projects.show('handsontable/handsontable-pro', function(project) {
      gitlab.projects.listTags(project, function(tagList) {
        if (tagList && tagList.length > 0) {
          tagList = tagList.sort(function(a, b) {
            if (semver.lt(a.name, b.name)) {
              return 1;
            }
            if (semver.gt(a.name, b.name)) {
              return -1;
            }

            return 0;
          });

          if (range) {
            tagList = tagList.filter(function(release) {
              return semver.satisfies(release.name, range);
            });
          }
          resolve(tagList.length ? tagList[0] : null);

        } else {
          reject();
        }
      });
    });
  });
};

/**
 * Get all availables docs version
 *
 * @returns {Promise}
 */
exports.getDocsVersions = function getDocsVersions() {
  return new Promise(function(resolve, reject) {
    github.repos.getBranches({
      user: 'handsontable',
      repo: 'docs-pro',
      per_page: 100
    }, function(err, resp) {
      if (err) {
        return reject(err);
      }
      var branches;

      branches = resp.filter(function(branch) {
        return branch.name.match(/^\d{1,5}\.\d{1,5}\.\d{1,5}(\-(beta|alpha)(\d+)?)?$/) ? true : false;

      }).map(function(branch) {
        return branch.name;

      }).sort(function(a, b) {
        if (semver.gt(a, b)) {
          return 1;
        }
        if (semver.lt(a, b)) {
          return -1;
        }

        return 0;
      });

      resolve(branches);
    });
  });
};
