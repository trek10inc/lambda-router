'use strict'

const bbPromise = require('bluebird')
const pathToRegexp = require('path-to-regexp')

class Router {
  constructor (options) {
    this.middleware = options.middleware || []
    this.routes = options.routes || []
    this.defaultRoute = options.defaultRoute
  }

  route (event) {
    // execute middleware
    return bbPromise.reduce(this.middleware, (event, middleware) => middleware(event), event)
      .then(middleWaredEvent => {
        // find route
        let route = this.routes.find(route => this.checkRoute(route, event)) || [null, null, this.defaultRoute];
        // execute route
        return bbPromise.reduce((Array.isArray(route[2]) ? route[2] : [route[2]]), (event, middleware) => middleware(event), middleWaredEvent);
      })
  }

  checkRoute (route, event) {
    // match method and path
    let methodMatches = route[0].toUpperCase() === 'ANY' ||
    ((event.httpMethod || '').toUpperCase() === route[0].toUpperCase())
    if (methodMatches) {
      let keys = [];
      let re = pathToRegexp(route[1], keys);
      let results = re.exec(event.path);
      if (results) {
        // add parsed path results to event.pathParameters to make it easy to interchange with apigateway routing
        event.pathParameters = event.pathParameters || {};
        keys.forEach(function (key, index) {
          event.pathParameters[key.name] = results[index + 1];
        });
        return true;
      }
    }
    return false;
  }
}

module.exports = Router
