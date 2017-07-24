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

// const middlewares = [
//   authorization
// ];

// const routes = [
//   // [ "METHOD", "path match regex", [ optionalmiddleware, optionalmiddleware, route]]
//   // [ "METHOD", "path match regex", route]
//   ["POST", "/token-vendor/zendesk", [requireAuth, zendeskRoute]],
//   ["POST", "/token-vendor/algolia", [requireAuth, algoliaRoute]],
//   ["POST", "/webhooks/create-user", newUserRoute],
//   ["GET", "/internal/clients/aws-accounts", [requireGeneralKey, awsAccountsRoute]],
// ];

// // const defaultRoute = [optionalmiddleware, ..., route ]
// const defaultRoute = indexRoute;
// module.exports = {
//   route: function (event, context) {
//     event._context = context; // merge context into event
//     // execute middleware
//     return bbPromise.reduce(middlewares, (event, middleware) => middleware(event), event)
//       .then(middleWaredEvent => {
//         let route = routes.find(route => checkRoute(route, event)) || [null, null, defaultRoute];
//         return bbPromise.reduce((Array.isArray(route[2]) ? route[2] : [route[2]]), (event, middleware) => middleware(event), middleWaredEvent);
//       })
//   }
// };

// function checkRoute(route, event) {
//   // match method and path
//   let methodMatches = route[0].toUpperCase() === 'ANY' || ((event.httpMethod || '').toUpperCase() === route[0].toUpperCase())
//   let keys = [];
//   let re = pathToRegexp(route[1], keys);
//   let results = re.exec(event.path);
//   if (results) {
//     event.route = {};
//     event.route.params = {};
//     keys.forEach(function (key, index) {
//       event.route.params[key.name] = results[index + 1];
//     });
//     return true;
//   }

//   return false;
// }
