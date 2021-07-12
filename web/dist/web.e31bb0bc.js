// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"index.js":[function(require,module,exports) {
var _window$localStorage;

var SERVER_URL = "/api";
var status_value = document.querySelector("#status_value");
var min_temp_value = document.querySelector("#min_temp_value");
var max_temp_value = document.querySelector("#max_temp_value");
var current_temp_value = document.querySelector("#current_temp_value");
var status_dialog = document.querySelector('#status_dialog');
var min_temp_dialog = document.querySelector('#min_temp_dialog');
var max_temp_dialog = document.querySelector('#max_temp_dialog');
var advanced_dialog = document.querySelector('#advanced_dialog');
var auth_dialog = document.querySelector('#auth_dialog');
var status_btn = document.querySelector('#status_btn');
var min_temp_btn = document.querySelector('#min_temp_btn');
var max_temp_btn = document.querySelector('#max_temp_btn');
var advanced_btn = document.querySelector('#advanced_btn');
var password = ((_window$localStorage = window.localStorage) === null || _window$localStorage === void 0 ? void 0 : _window$localStorage.getItem('pass')) || "";
var fetch_interval;
var temp_chart_instance = undefined;
var power_chart_instance = undefined;

function getData(path) {
  return new Promise(function (resolve, reject) {
    fetch(SERVER_URL + "/" + path, {
      method: "GET",
      headers: {
        'Authorization': password
      }
    }).then(function (res) {
      if (res.ok) {
        res.json().then(function (json) {
          resolve(json);
        });
      } else {
        reject(res.statusText);
      }
    }).catch(function (err) {
      reject(err);
    });
  });
}

function setData(path, data) {
  return new Promise(function (resolve, reject) {
    fetch(SERVER_URL + "/" + path, {
      method: "POST",
      body: data,
      headers: {
        'Authorization': password
      }
    }).then(function (res) {
      if (res.ok) {
        res.json().then(function (json) {
          resolve(json);
        });
      } else {
        reject(res.statusText);
      }
    }).catch(function (err) {
      reject(err);
    });
  });
}

function fetchData() {
  var requests = ["status", "current_temp", "min_temp", "max_temp", "work_time", "pause_time", "timeline_temp", "timeline_power"];
  Promise.all(requests.map(function (path) {
    return getData(path);
  })).then(function (results) {
    var _resultObj$timeline_t, _resultObj$timeline_p, _resultObj$timeline_t2, _resultObj$timeline_p2;

    var resultObj = requests.reduce(function (acc, path, index) {
      acc[path] = results[index].result;
      return acc;
    }, {});

    if (resultObj.status == "Oprit") {
      status_btn.innerHTML = "Porneste";
    } else {
      status_btn.innerHTML = "Opreste";
    }

    status_value.innerHTML = resultObj.status || "n/a";
    min_temp_value.innerHTML = resultObj.min_temp || "n/a";
    max_temp_value.innerHTML = resultObj.max_temp || "n/a";
    current_temp_value.innerHTML = resultObj.current_temp || "n/a";
    var temp_dates = ((_resultObj$timeline_t = resultObj.timeline_temp) === null || _resultObj$timeline_t === void 0 ? void 0 : _resultObj$timeline_t.keys) || [];
    var power_dates = ((_resultObj$timeline_p = resultObj.timeline_power) === null || _resultObj$timeline_p === void 0 ? void 0 : _resultObj$timeline_p.keys) || [];
    var temp_values = ((_resultObj$timeline_t2 = resultObj.timeline_temp) === null || _resultObj$timeline_t2 === void 0 ? void 0 : _resultObj$timeline_t2.values) || [];
    var power_values = ((_resultObj$timeline_p2 = resultObj.timeline_power) === null || _resultObj$timeline_p2 === void 0 ? void 0 : _resultObj$timeline_p2.values) || [];

    if (temp_chart_instance) {
      temp_chart_instance.destroy();
    }

    if (power_chart_instance) {
      power_chart_instance.destroy();
    }

    temp_chart_instance = new Chart("temp_chart", {
      type: "line",
      data: {
        labels: temp_dates,
        datasets: [{
          label: "Temperatura",
          fill: false,
          lineTension: 0,
          backgroundColor: "rgba(255,0,0,1.0)",
          borderColor: "rgba(255,0,0,0.75)",
          data: temp_values
        }]
      }
    });
    power_chart_instance = new Chart("power_chart", {
      type: "line",
      data: {
        labels: power_dates,
        datasets: [{
          label: "Energie",
          fill: false,
          lineTension: 0,
          backgroundColor: "rgba(0,0,255,1.0)",
          borderColor: "rgba(0,0,255,0.75)",
          data: power_values
        }]
      }
    });
  }).catch(function (err) {
    console.log(err);
    clearInterval(fetch_interval);
    alert("Nu se poate comunica cu serverul!");
    auth_dialog.showModal();
  });
}

if (!status_dialog.showModal) {
  dialogPolyfill.registerDialog(status_dialog);
}

if (!min_temp_dialog.showModal) {
  dialogPolyfill.registerDialog(min_temp_dialog);
}

if (!max_temp_dialog.showModal) {
  dialogPolyfill.registerDialog(max_temp_dialog);
}

if (!advanced_dialog.showModal) {
  dialogPolyfill.registerDialog(advanced_dialog);
}

if (!auth_dialog.showModal) {
  dialogPolyfill.registerDialog(auth_dialog);
}

if (!password) {
  auth_dialog.showModal();
} else {
  fetchData();
  fetch_interval = setInterval(fetchData, 10000);
}

auth_dialog.querySelector(".submit").addEventListener('click', function () {
  var _window$localStorage2;

  clearInterval(fetch_interval);
  password = auth_dialog.querySelector("#pass_input").value;
  fetchData().then(function () {
    fetch_interval = setInterval(fetchData, 10000);
  });
  (_window$localStorage2 = window.localStorage) === null || _window$localStorage2 === void 0 ? void 0 : _window$localStorage2.setItem('pass', password);
  auth_dialog.close();
});
status_btn.addEventListener('click', function () {
  var current = status_value.innerHTML;
  document.querySelector('#old_status_value').innerHTML = current;

  if (current == "Oprit") {
    document.querySelector('#new_status_value').innerHTML = "Pornit";
  } else {
    document.querySelector('#new_status_value').innerHTML = "Oprit";
  }

  status_dialog.showModal();
});
status_dialog.querySelector('.close').addEventListener('click', function () {
  status_dialog.close();
});
status_dialog.querySelector('.submit').addEventListener('click', function () {
  status_dialog.close();
  setData('state', 'test');
  fetchData();
});
min_temp_btn.addEventListener('click', function () {
  var current = parseFloat(min_temp_value.innerHTML);
  document.querySelector("#min_input").value = current;
  min_temp_dialog.showModal();
});
min_temp_dialog.querySelector('.close').addEventListener('click', function () {
  min_temp_dialog.close();
});
min_temp_dialog.querySelector('.submit').addEventListener('click', function () {
  var current = parseFloat(document.querySelector("#min_input").value);
  setData('min_temp', current);
  fetchData();
  min_temp_dialog.close();
});
min_temp_dialog.querySelector("#plus_min_input").addEventListener('click', function () {
  var current = parseFloat(document.querySelector("#min_input").value);
  document.querySelector("#min_input").value = (current + 0.1).toFixed(1);
});
min_temp_dialog.querySelector("#minus_min_input").addEventListener('click', function () {
  var current = parseFloat(document.querySelector("#min_input").value);
  document.querySelector("#min_input").value = (current - 0.1).toFixed(1);
});
max_temp_btn.addEventListener('click', function () {
  var current = parseFloat(max_temp_value.innerHTML);
  document.querySelector("#max_input").value = current;
  max_temp_dialog.showModal();
});
max_temp_dialog.querySelector('.close').addEventListener('click', function () {
  max_temp_dialog.close();
});
max_temp_dialog.querySelector('.submit').addEventListener('click', function () {
  var current = parseFloat(document.querySelector("#max_input").value);
  setData('max_temp', current);
  fetchData();
  max_temp_dialog.close();
});
max_temp_dialog.querySelector("#plus_max_input").addEventListener('click', function () {
  var current = parseFloat(document.querySelector("#max_input").value);
  document.querySelector("#max_input").value = (current + 0.1).toFixed(1);
});
max_temp_dialog.querySelector("#minus_max_input").addEventListener('click', function () {
  var current = parseFloat(document.querySelector("#max_input").value);
  document.querySelector("#max_input").value = (current - 0.1).toFixed(1);
});
advanced_btn.addEventListener('click', function () {
  advanced_dialog.showModal();
});
advanced_dialog.querySelector('.close').addEventListener('click', function () {
  advanced_dialog.close();
});
advanced_dialog.querySelector('.submit').addEventListener('click', function () {
  advanced_dialog.close();
});
},{}],"../../../.nvm/versions/node/v14.17.1/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "36391" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../.nvm/versions/node/v14.17.1/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.js"], null)
//# sourceMappingURL=/web.e31bb0bc.js.map