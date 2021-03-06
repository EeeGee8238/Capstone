const firebase = require('firebase');

// -- // -- // -- // Firebase Config // -- // -- // -- //
const config = {
  apiKey: 'AIzaSyBx2uMyZg32XKa7aCSY83YeJULnmNL3xLY',
  authDomain: 'myach-fsa.firebaseapp.com',
  databaseURL: 'https://myach-fsa.firebaseio.com',
  projectId: 'myach-fsa',
  storageBucket: 'myach-fsa.appspot.com',
  messagingSenderId: '51959276382'
};

// -- // -- // -- // -- // -- // -- // -- // -- // -- //

// Initialize the app, but make sure to do it only once.
//   (We need this for the tests. The test runner busts the require
//   cache when in watch mode; this will cause us to evaluate this
//   file multiple times. Without this protection, we would try to
//   initialize the app again, which causes Firebase to throw.
//
//   This is why global state makes a sad panda.)
firebase.__bonesApp || (firebase.__bonesApp = firebase.initializeApp(config));

module.exports = firebase;
