importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBBNE3vjnOMFIDWdFzm0NIsoaFsiBDsb6k",
  authDomain: "play-and-earn-ba282.firebaseapp.com",
  projectId: "play-and-earn-ba282",
  storageBucket: "play-and-earn-ba282.firebasestorage.app",
  messagingSenderId: "905951699525",
  appId: "1:905951699525:web:f096537b769b3d7aa1392c",
});

const messaging = firebase.messaging();
