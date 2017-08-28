# karma-nwjs-phoenix-launcher

Launcher for NWJS, that uses [nwjs-builder-phoenix](https://github.com/evshiron/nwjs-builder-phoenix/) to provide the NW.js builds

---

This launcher is forked from [karma-nwjs-launcher](https://github.com/vicwang163/karma-nwjs-launcher) and updated to use nwjs-builder-phoenix.

The **main** difference between this launcher and other NW.js Karma launchers is that this launcher **does not** bind to a particular build/version of NW.js. It is up to the project to configure (via nwjs-builder-phoenix) the build to use.

---


## Installation

The easiest way is to keep `karma-nwjs-phoenix-launcher` as a devDependency in your `package.json`.


    {
      "devDependencies": {
        "karma": "~0.10",
        "karma-nwjs-phoenix-launcher": "0.1.0"
      }
    }


You can do it on the command line by:

    npm install karma-nwjs-phoenix-launcher --save-dev

## Usage

    // karma.conf.js
    module.exports = function(config) {
      browsers: [ 'NWJS' ],
      NWJSConfig:{
        copy:{
          base: projectRoot,
          items: [ 'xxx/src/config' ]
        }
      }
    };
