/**
 * This file is used to build Handsontable Pro documentation.
 *
 * Installation:
 * 1. Install Grunt CLI (`npm install -g grunt-cli`)
 * 1. Install Grunt 0.4.0 and other dependencies (`npm install`)
 *
 * Build:
 * Execute `grunt` from root directory of this directory (where Gruntfile.js is)
 *
 * Result:
 * Building Handsontable docs will create files:
 *  - generated/*
 *
 * See http://gruntjs.com/getting-started for more information about Grunt
 */

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var path = require('path');
var gitHelper = require('./git-helper');


module.exports = function (grunt) {
  var
      DOCS_PATH = 'generated',
      HOT_SRC_PATH = 'src/handsontable',
      HOT_DEFAULT_BRANCH = 'master',
      HOT_PRO_SRC_PATH = 'src/handsontable-pro',
      HOT_PRO_DEFAULT_BRANCH = 'master',
      HOT_REPO = 'https://github.com/handsontable/handsontable.git',
      HOT_PRO_REPO = 'git@git.handsontable.com:handsontable/handsontable-pro.git',
      querystring = require('querystring');

  function getHotProBranch() {
    var hotProVersion = argv['hot-pro-version'];

    return hotProVersion ? (hotProVersion === 'latest' ? HOT_PRO_DEFAULT_BRANCH : hotProVersion) : gitHelper.getLocalInfo().branch;
  }

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      dist: [DOCS_PATH],
      source: [HOT_SRC_PATH],
      sourcePro: [HOT_PRO_SRC_PATH]
    },

    jsdoc: {
      docs: {
        src: [
          HOT_SRC_PATH + '/src/**/*.js',
          '!' + HOT_SRC_PATH + '/src/**/*.spec.js',
          '!' + HOT_SRC_PATH + '/src/3rdparty/walkontable/src/**/*.js',
          '!' + HOT_SRC_PATH + '/src/3rdparty/walkontable/test/**/*.js',
          '!' + HOT_SRC_PATH + '/src/intro.js',
          '!' + HOT_SRC_PATH + '/src/outro.js',
          // Pro package
          HOT_PRO_SRC_PATH + '/src/**/*.js',
          '!' + HOT_SRC_PATH + '/src/plugins/touchScroll/touchScroll.js',
          '!' + HOT_PRO_SRC_PATH + '/src/**/*.spec.js',
          '!' + HOT_PRO_SRC_PATH + '/src/plugins/ganttChart/dateCalculator.js',
          '!' + HOT_PRO_SRC_PATH + '/src/3rdparty/walkontable/src/**/*.js',
          '!' + HOT_PRO_SRC_PATH + '/src/3rdparty/walkontable/test/**/*.js',
        ],
        jsdoc: 'node_modules/.bin/' + (/^win/.test(process.platform) ? 'jsdoc.cmd' : 'jsdoc'),
        options: {
          verbose: true,
          destination: DOCS_PATH,
          configure: 'conf.json',
          template: './',
          tutorials: 'tutorials',
          'private': false,
          query: ''
        }
      }
    },

    sass: {
      dist: {
        src: 'sass/main.scss',
        dest: 'static/styles/main.css'
      }
    },

    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: 'src',
          dest: 'generated',
          src: [
            'static/**'
          ]
        }]
      }
    },

    bowercopy: {
      options: {
        srcPrefix: 'bower_components'
      },
      scripts: {
        options: {
          destPrefix: 'generated/bower_components'
        },
        files: {
          'axios': 'axios/dist/axios.min.js',
          'jquery/jquery.min.js': 'jquery/dist/jquery.min.js',
          'fastclick': 'fastclick',
          'jquery.cookie': 'jquery.cookie',
          'jquery-placeholder': 'jquery-placeholder',
          'modernizr': 'modernizr',
          'handsontable-pro': 'handsontable-pro',
          'zeroclipboard': 'zeroclipboard',
          'pikaday': 'pikaday',
          "moment": "moment",
          "backbone": "backbone",
          "backbone.relational": "backbone.relational",
          "highlightjs": "highlightjs",
          "chroma-js": "chroma-js",
          "raphael": "raphael",
          "bootstrap": "bootstrap",
          "numbro": "numbro",
          "font-awesome": "font-awesome",
          "lodash": "lodash",
          "promise-polyfill": "promise-polyfill",
        }
      }
    },

    watch: {
      files: ['tutorials/**', 'sass/**', 'static/**', 'tmpl/**'],
      tasks: [],
      options: {
        debounceDelay: 250
      },
      dist: {
        files: ['generated/**'],
        options: {
          livereload: true
        }
      }
    },

    connect: {
      dist: {
        options: {
          port: 5455,
          hostname: '0.0.0.0',
          base: 'generated',
          livereload: true
        }
      }
    },

    open: {
      dist: {
        path: 'http://localhost:5455'
      }
    },

    robotstxt: {
      dist: {
        dest: DOCS_PATH + '/',
        policy: [
          {
            ua: '*',
            allow: '/'
          },
          {
            host: 'docs.handsontable.com'
          }
        ]
      }
    },

    sitemap: {
      dist: {
        pattern: ['generated/*.html', '!generated/tutorial-40*.html'],
        siteRoot: 'generated/'
      }
    },

    gitclone: {
      handsontable: {
        options: {
          branch: HOT_DEFAULT_BRANCH,
          repository: HOT_REPO,
          directory: HOT_SRC_PATH,
          verbose: true
        }
      },
      handsontablePro: {
        options: {
          branch: HOT_PRO_DEFAULT_BRANCH,
          repository: HOT_PRO_REPO,
          directory: HOT_PRO_SRC_PATH,
          verbose: true
        }
      }
    },

    env: {
      build: {
        src : '.env.json'
      }
    }
  });

  grunt.registerTask('server', [
    'connect',
    'open',
    'watch'
  ]);

  grunt.registerTask('default', ['env:build', 'authenticate-git', 'update-hot-pro', 'update-hot', 'generate-docs']);

  grunt.registerTask('build', ['env:build', 'authenticate-git', 'build-docs']);

  grunt.registerTask('authenticate-git', 'Authenticate Github and Gitlab', function () {
    if (!gitHelper.gitlab || !gitHelper.github) {
      gitHelper.setupGitApi(process.env.GITHUB_TOKEN, process.env.GITLAB_TOKEN);
    }
  });

  grunt.registerTask('update-hot', 'Update Handsontable repository', function () {
    var hotPackage = grunt.file.readJSON(HOT_PRO_SRC_PATH + '/package.json');;

    grunt.config.set('gitclone.handsontable.options.branch', hotPackage.compatibleHotVersion);
    grunt.log.write('Cloning Handsontable v.' + hotPackage.compatibleHotVersion);

    grunt.task.run('clean:source');
    grunt.task.run('gitclone:handsontable');
  });

  grunt.registerTask('update-hot-pro', 'Update Handsontable Pro repository', function () {
    var hotProBranch = getHotProBranch();

    grunt.config.set('gitclone.handsontablePro.options.branch', hotProBranch);
    grunt.log.write('Cloning Handsontable Pro v.' + hotProBranch);

    grunt.task.run('clean:sourcePro');
    grunt.task.run('gitclone:handsontablePro');
  });

  grunt.registerTask('generate-docs', 'Generate the documentation', function () {
    var timer;
    var done = this.async();

    timer = setInterval(function() {

      if (!grunt.file.isFile(HOT_SRC_PATH + '/package.json') || !grunt.file.isFile(HOT_PRO_SRC_PATH + '/package.json')) {
        return;
      }

      clearInterval(timer);
      grunt.task.run('build');
      grunt.task.run('generate-doc-versions');

      done();
    }, 50);
  });

  grunt.registerTask('generate-doc-versions', 'Generate version list for Handsontable Pro', function () {
    var done = this.async();

    gitHelper.getDocsVersions().then(function(branches) {
      var content = 'docVersions && docVersions(' + JSON.stringify(branches.reverse()) + ')';

      grunt.log.write('The following versions found: ' + branches.join(', '));
      fs.writeFile(path.join(DOCS_PATH, 'scripts', 'doc-versions.js'), content, done);
    });
  });

  grunt.registerTask('build-docs', 'Generate the documentation', function () {
    var done = this.async();
    var hotPackage;

    if (argv['hot-pro-version']) {
      grunt.config.set('jsdoc.docs.options.query', querystring.stringify({
        version: getHotProBranch(),
        latestVersion: getHotProBranch()
      }));

      grunt.task.run('sass', 'copy', 'bowercopy', 'robotstxt', 'jsdoc', 'sitemap');
      done();

    } else {
      gitHelper.getHotLatestRelease().then(function(info) {
        hotPackage = grunt.file.readJSON(HOT_PRO_SRC_PATH + '/package.json');
        grunt.config.set('jsdoc.docs.options.query', querystring.stringify({
          version: hotPackage.version,
          latestVersion: info.name
        }));

        grunt.task.run('sass', 'copy', 'bowercopy', 'robotstxt', 'jsdoc', 'sitemap');
        done();
      });
    }
  });

  grunt.loadNpmTasks('grunt-bowercopy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-git');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-robots-txt');
  grunt.loadNpmTasks('grunt-sitemap');
  grunt.loadNpmTasks('grunt-env');
};
