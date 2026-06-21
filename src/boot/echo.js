import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import API from '../services/api';

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
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                API.post('http://localhost:8000/api/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name
                })
                .then(response => {
                    callback(false, response);
                })
                .catch(error => {
                    callback(true, error);
                });
            }
        };
    },
  });

  app.config.globalProperties.$echo = window.Echo;
};
