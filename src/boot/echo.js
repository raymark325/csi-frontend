import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import API from '../services/api';

export default ({ app }) => {
  window.Pusher = Pusher;

  // Runtime-configurable — update in browser console with:
  //   localStorage.setItem('csi_ws_host', 'new-tunnel.trycloudflare.com')
  //   localStorage.setItem('csi_api_url', 'https://new-tunnel.trycloudflare.com/api')
  const wsHost    = localStorage.getItem('csi_ws_host')
                 || import.meta.env.QCLI_REVERB_HOST
                 || 'soon-area-constitution-faqs.trycloudflare.com';
  const wsPort    = Number(localStorage.getItem('csi_ws_port')  || import.meta.env.QCLI_REVERB_PORT  || 443);
  const wssPort   = wsPort;
  const forceTLS  = (localStorage.getItem('csi_ws_tls') ?? (import.meta.env.QCLI_REVERB_SCHEME || 'https')) === 'https';
  const apiBase   = localStorage.getItem('csi_api_url')
                 || import.meta.env.QCLI_API_URL
                 || 'https://gary-audience-decided-own.trycloudflare.com/api';

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

