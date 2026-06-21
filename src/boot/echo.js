import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export default ({ app }) => {
  window.Pusher = Pusher;

  window.Echo = new Echo({
    broadcaster: 'reverb',
    key: 'xoaw9trlnpec7xbcakyp',
    wsHost: 'localhost',
    wsPort: 8080,
    wssPort: 8080,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: 'http://localhost:8000/api/broadcasting/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`
      }
    }
  });

  app.config.globalProperties.$echo = window.Echo;
};
