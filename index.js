var fs = require('fs');
var path = require('path');
var ncp = require('ncp').ncp;
var async = require('async');
var merge = require('merge');
var copy = require('copy');
var builder = require('nwjs-builder-phoenix');

var NodeWebkitBrowser = function(baseBrowserDecorator, args, config) {
  baseBrowserDecorator(this);

  var customOptions = args.options || {};
  var searchPaths = (args.paths || ['node_modules']).map(function(searchPath) {
    return path.join(process.cwd(), searchPath);
  });
  searchPaths.unshift(process.env.NODE_PATH);

  this._findCommand = function(callback) {
    var command = this._getCommand();

    if (command !== null) {
      callback(null, command);

      return;
    }

    /*
     * Assuming this script is at <project_root>/node_modules/karma-nwjs-phoenix-launcher,
     * this should resolve to <project_root>/package.json.
     *
     * It won't work if the package is installed via `npm link` because in that scenario
     * `__dirname` provides the module's original path, not its installed path.
     */
    var pkgPath = path.join(path.resolve(__dirname, "../.."), "package.json");
    var pkg = JSON.parse(fs.readFileSync(pkgPath));
    var nwVersion = pkg.build.nwVersion;

    (new builder.Downloader({
      platform: process.platform,
      arch: process.arch,
      version: nwVersion,
      flavor: 'sdk',
      useCaches: true,
      showProgress: true
    }))
    .fetchAndExtract()
    .then(function(extracted) {
      return builder.findExecutable(process.platform, extracted);
    })
    .then(function(found) {
      callback(null, found);
    })
    .catch(callback);
  };

  // used by Karma
  this._start = function(url) {
    var self = this;
    var SOURCE_PATH = path.join(__dirname, 'runner.nw');
    var STATIC_PATH = path.join(self._tempDir, 'runner.nw');
    var INDEX_HTML = path.join(STATIC_PATH, 'index.html');
    var PACKAGE_JSON = path.join(STATIC_PATH, 'package.json');

    async.auto({
      'command': function(callback) {
        self._findCommand(callback);
      },
      'directory': function(callback) {
        ncp(SOURCE_PATH, STATIC_PATH, callback);
      },
      'copy': function(callback) {
        var items = config.copy.items;
        var len = config.copy.items.length;
        var base = config.copy.base;
        for( var i=0;i<config.copy.items.length;i++){
          copy(base+items[i]+'/**/*', STATIC_PATH+items[i], function(){
            if( --len == 0 ){
              callback();
            }
          })
        }
      },
      'index.html:read': ['directory', 'copy', function(callback) {
        fs.readFile(INDEX_HTML, callback);
      }],
      'index.html:write': ['index.html:read', function(callback, results) {
        var content = results['index.html:read'].toString().replace('%URL%', url);
        fs.writeFile(INDEX_HTML, content, callback);
      }],
      'package.json:read': ['directory', 'copy', function(callback) {
        fs.readFile(PACKAGE_JSON, callback);
      }],
      'package.json:write': ['package.json:read', function(callback, results) {
        var options = JSON.parse(results['package.json:read'].toString());
        options = merge(true, options, customOptions);
        fs.writeFile(PACKAGE_JSON, JSON.stringify(options), callback);
      }],
      'exec': ['index.html:write', 'package.json:write', 'command', function(callback, results) {
        process.env.NODE_PATH = searchPaths.join(path.delimiter);
				args.flags = args.flags || [];

				self._execCommand(results['command'], [STATIC_PATH].concat(args.flags));
      }]
    });
  };
};

NodeWebkitBrowser.prototype = {
  name: 'NW.js',

  DEFAULT_CMD: {
    linux: null,
    darwin: null,
    win32: null
  },

  ENV_CMD: 'NODEWEBKIT_BIN'
};

NodeWebkitBrowser.$inject = ['baseBrowserDecorator', 'args', 'config.NWJS'];

// PUBLISH DI MODULE
module.exports = {
  'launcher:NWJS': ['type', NodeWebkitBrowser]
};
