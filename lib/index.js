var fs          = require('fs')
var _           = require('lodash')
var express     = require('express')
var createError = require('http-errors')
var bodyParser  = require('body-parser')

module.exports = function (config, params) {
  var router = express.Router()
  var handlebars = params.Handlebars
  var auth = params.auth

  var loadTemplate = function (name) {
    var path = require.resolve('../templates/' + name + '.hbs')
    return fs.readFileSync(path, 'utf8')
  }

  handlebars.registerPartial('form', loadTemplate('_form'))

  var templates = {}

  ;['index', 'new'].forEach(function (template) {
    templates[template] = handlebars.compile(loadTemplate(template))
  })

  router.use(bodyParser.urlencoded({extended: false}))

  router.use(function (req, res, next) {
    req.currentUser = req.remote_user
    if (_.intersection(config.allowed_groups, req.currentUser.groups).length === 0) {
      next(createError(403, 'You are not allowed to view this page'))
    }
    next()
  })

  router.get('/', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html')

    next(templates.index(_.extend({}, req.base_params, {
    })))
  })

  router.get('/new', function (req, res, next) {
    res.setHeader('Content-Type', 'text/html')

    next(templates.new(_.extend({}, req.base_params, {
    })))
  })

  router.post('/', function (req, res, next) {
    if (!req.body.username || !req.body.password) {
      var error = 'Please enter username and password'
      res.send(templates.new(_.extend({error: error}, req.base_params)))
      return next()
    }
    auth.add_user(req.body.username, req.body.password, function (err) {
      if (err) {
        res.send(templates.new(_.extend({error: err.message}, req.base_params)))
        return next()
      }
      res.redirect('/-/users')
      next()
    })
  })

  return {
    basePath: 'users',
    title: 'Users',
    middleware: router
  }
}
