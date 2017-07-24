'use strict'

const Router = require('./index.js')
const bbPromise = require('bluebird')
const test = require('tape')
const sinon = require('sinon')

test('router should', t => {
  let middleware = {
    first: new sinon.spy(x => x), // can be regular function 
    second: new sinon.spy(x => bbPromise.resolve(x)), // or can return a promise
    third: new sinon.spy(x => bbPromise.resolve(x))  
  }

  let routes = {
    getWidgets: new sinon.spy(x => x),
    getWidget: new sinon.spy(x => x),
    defaultRoute: new sinon.spy(x => x)
  }
  let router = new Router({
    middleware: [
      middleware.first,
      middleware.second
    ],
    routes: [
      [ 'GET', '/widgets', routes.getWidgets],
      [ 'GET', '/widgets/:widgetId', [ middleware.third, routes.getWidget ] ]
    ],
    defaultRoute: routes.defaultRoute
  });
  
  router.route({ httpMethod: 'GET', path: '/widgets' })
  .then(result => {
    t.assert(middleware.first.calledOnce && middleware.second.calledOnce, 'call common middleware')
    t.assert(routes.getWidgets.calledOnce, 'call correct route')
  })
  .then(() => {
    return router.route({ httpMethod: 'GET', path: '/widgets/1' })
    .then(result => {
      t.equals((result.pathParameters || {}).widgetId, '1', 'add path parameters to event object')
      t.assert(middleware.third, 'call route level middleware')
      t.assert(routes.getWidget.calledOnce, 'call correct route')
    })
  })
  .then(() => {
    return router.route({ httpMethod: 'POST', path: '/widgets/1' })
    .then(result => {
      t.assert(routes.defaultRoute.calledOnce, 'call default route')
    })
  })
  .then(t.end)
})

test('router route checker should', t => {
  let router = new Router({});
  
  t.ok(router.checkRoute(['ANY', '/*', []], { httpMethod: 'GET', path: '/widgets' }), 'match any method when route specifies \'ANY\' method')
  t.ok(router.checkRoute(['GET', '/*', []], { httpMethod: 'GET', path: '/widgets' }), 'match when specified method is same as event method')
  t.notOk(router.checkRoute(['GET', '/*', []], { httpMethod: 'PUT', path: '/widgets' }), 'not match when specified method is not the same as event method')
  t.notOk(router.checkRoute(['GET', '/*', []], { path: '/widgets' }), 'not match when event method is missing')
  t.ok(router.checkRoute(['ANY', '/widgets', []], { httpMethod: 'GET', path: '/widgets' }), 'match when specified path is same the as event path')
  t.ok(router.checkRoute(['ANY', '/widgets/:widgetId', []], { httpMethod: 'GET', path: '/widgets/1234' }), 'match when using path parameters')
  t.end()
})