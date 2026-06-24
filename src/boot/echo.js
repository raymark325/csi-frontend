import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import API from '../services/api';

export default ({ app }) => {
  window.Pusher = Pusher;

  const wsHost    = import.meta.env.QCLI_REVERB_HOST   || 'soon-area-constitution-faqs.trycloudflare.com';
  const wsPort    = import.meta.env.QCLI_REVERB_PORT   || 443;
  const wssPort   = import.meta.env.QCLI_REVERB_PORT   || 443;
  const forceTLS  = import.meta.env.QCLI_REVERB_SCHEME ? import.meta.env.QCLI_REVERB_SCHEME === 'https' : true;
  const apiBase   = import.meta.env.QCLI_API_URL        || 'https://gary-audience-decided-own.trycloudflare.com/api';

  window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.QCLI_REVERB_APP_KEY || 'xoaw9trlnpec7xbcakyp',
    wsHost,
    wsPort: Number(wsPort),
    wssPort: Number(wssPort),
    forceTLS,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${apiBase}/broadcasting/auth`,
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                API.post(`${apiBase}/broadcasting/auth`, {
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

