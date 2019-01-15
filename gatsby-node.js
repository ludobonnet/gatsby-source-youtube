"use strict";

var getVideos = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(channelId, apiKey) {
    var api, videos, channelResp, channelData, uploadsId, pageSize, videoResp, nextPageToken;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            api = getApi();
            videos = [];
            _context.prev = 2;
            _context.next = 5;
            return api.get("channels?part=contentDetails&id=" + channelId + "&key=" + apiKey);

          case 5:
            channelResp = _context.sent;
            channelData = channelResp.data.items[0];

            if (!channelData) {
              _context.next = 23;
              break;
            }

            uploadsId = get(channelData, "contentDetails.relatedPlaylists.uploads");
            pageSize = Math.min(50, maxVideos);
            _context.next = 12;
            return api.get("playlistItems?part=snippet%2CcontentDetails%2Cstatus&maxResults=" + pageSize + "&playlistId=" + uploadsId + "&key=" + apiKey);

          case 12:
            videoResp = _context.sent;

            videos.push.apply(videos, _toConsumableArray(videoResp.data.items));

          case 14:
            if (!(videoResp.data.nextPageToken && videos.length < maxVideos)) {
              _context.next = 23;
              break;
            }

            pageSize = Math.min(50, maxVideos - videos.length);
            nextPageToken = videoResp.data.nextPageToken;
            _context.next = 19;
            return api.get("playlistItems?part=snippet%2CcontentDetails%2Cstatus&maxResults=" + pageSize + "&pageToken=" + nextPageToken + "&playlistId=" + uploadsId + "&key=" + apiKey);

          case 19:
            videoResp = _context.sent;

            videos.push.apply(videos, _toConsumableArray(videoResp.data.items));
            _context.next = 14;
            break;

          case 23:
            return _context.abrupt("return", videos);

          case 26:
            _context.prev = 26;
            _context.t0 = _context["catch"](2);

            console.error(_context.t0);
            process.exit(1);

          case 30:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[2, 26]]);
  }));

  return function getVideos(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var axios = require("axios");
var get = require("lodash/get");
var normalize = require("./normalize");
var polyfill = require("babel-polyfill");

function getApi() {
  var rateLimit = 500;
  var lastCalled = null;

  var rateLimiter = function rateLimiter(call) {
    var now = Date.now();
    if (lastCalled) {
      lastCalled += rateLimit;
      var wait = lastCalled - now;
      if (wait > 0) {
        return new Promise(function (resolve) {
          return setTimeout(function () {
            return resolve(call);
          }, wait);
        });
      }
    }
    lastCalled = now;
    return call;
  };

  var api = axios.create({
    baseURL: "https://www.googleapis.com/youtube/v3/"
  });

  api.interceptors.request.use(rateLimiter);

  return api;
}

exports.sourceNodes = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(_ref2, _ref3) {
    var boundActionCreators = _ref2.boundActionCreators,
        store = _ref2.store,
        cache = _ref2.cache,
        createNodeId = _ref2.createNodeId;
    var channelsIds = _ref3.channelsIds,
        apiKey = _ref3.apiKey,
        _ref3$maxVideos = _ref3.maxVideos,
        maxVideos = _ref3$maxVideos === undefined ? 50 : _ref3$maxVideos;
    var createNode, videos;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            createNode = boundActionCreators.createNode;
            _context3.prev = 1;
            _context3.next = 4;
            return Promise.all(channelsIds.map(function () {
              var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(channelId) {
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        _context2.next = 2;
                        return getVideos(channelId, apiKey);

                      case 2:
                        return _context2.abrupt("return", _context2.sent);

                      case 3:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2, undefined);
              }));

              return function (_x5) {
                return _ref5.apply(this, arguments);
              };
            }()));

          case 4:
            videos = _context3.sent;


            console.log(videos);

            videos = normalize.normalizeRecords(videos);
            videos = normalize.createGatsbyIds(videos, createNodeId);
            _context3.next = 10;
            return normalize.downloadThumbnails({
              items: videos,
              store: store,
              cache: cache,
              createNode: createNode
            });

          case 10:
            videos = _context3.sent;

            normalize.createNodesFromEntities(videos, createNode);
            return _context3.abrupt("return");

          case 15:
            _context3.prev = 15;
            _context3.t0 = _context3["catch"](1);

            console.error(_context3.t0);
            process.exit(1);

          case 19:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, undefined, [[1, 15]]);
  }));

  return function (_x3, _x4) {
    return _ref4.apply(this, arguments);
  };
}();