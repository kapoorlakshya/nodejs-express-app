var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var expressSession = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

require('./models');

var User = mongoose.model("User");

mongoose.connect('mongodb://localhost:27017/mongo-data', {useNewUrlParser: true, useUnifiedTopology: true});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSession({
    secret: "asdad21312zsdh102uy4-123asdjas-123123"
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, function (email, password, next) {
    User.findOne({
        email: email
    }, function (err, user) {
        if (err) return next(err);
        if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
            return next({message: 'Email or password incorrect.'})
        }
        next(null, user);
    })
}));

passport.use("signup-local", new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, function (email, password, next) {
    User.findOne({
        email: email
    }, function (err, user) {
        if (err) return next(err);
        if (user) return (next({message: "User already exists"}));

        let newUser = new User({
            email: email,
            passwordHash: bcrypt.hashSync(password, 10)
        });
        newUser.save(function (err) {
            next(err, newUser);
        });
    });
}));

passport.serializeUser((function (user, next) {
    next(null, user.id);
}));

passport.deserializeUser(function (id, next) {
    User.findById(id, function (err, user) {
        next(err, user);
    })
});

app.get('/', function (req, res, next) {
    res.render('index', {title: "Saas Tutorial"})
});

app.get('/main', function (req, res, next) {
    res.render('main')
});

app.post('/login',
    passport.authenticate('local', {failureRedirect: '/login-page'}),
    function (req, res) {
        res.redirect('/main');
    });

app.get('/login-page', function (req, res, next) {
    res.render('login-page')
});

app.post('/signup',
    passport.authenticate('signup-local', {failureRedirect: '/'}),
    function (req, res) {
        res.redirect('/main');
    });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
