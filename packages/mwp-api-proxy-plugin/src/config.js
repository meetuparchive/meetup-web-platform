import { getServer } from 'mwp-config';

export const API_PROXY_PLUGIN_NAME = 'mwp-api-proxy-plugin';
export const API_ROUTE_PATH = getServer().properties.app_server.api_proxy_path;
