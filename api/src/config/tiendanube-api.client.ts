import axios from "axios";
import { userRepository } from "@repository";
import { HttpErrorException } from "@utils";

export const tiendanubeApiClient = axios.create({
  baseURL: process.env.TIENDANUBE_API_URL,
  headers: {
    "Content-Type": "application/json",
    "User-Agent": `${process.env.CLIENT_ID} (${process.env.CLIENT_EMAIL})`,
  },
});

tiendanubeApiClient.interceptors.request.use(
  async (config) => {

    // Do something before request is sent
    const storeUserId = +config.url?.split("/")[0]!!;
    const user = await userRepository.findOne(storeUserId);

    config.headers["Authentication"] = `bearer ${user.access_token}`;

    // 🔍 DEBUGGING: Log complete request details
    console.log('🚀 [CLIENT REQUEST]', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      headers: config.headers,
      params: config.params,
      data: config.data,
    });

    return config;
  },
  function (error) {
    // Do something with request error

    if (error.isAxiosError) {
      const { data } = error.response;
      const payload = new HttpErrorException(
        "TiendanubeApiClient - " + data?.message,
        data?.description
      );
      payload.setStatusCode(data?.code);
      return Promise.reject(payload);
    }

    return Promise.reject(error);
  }
);

tiendanubeApiClient.interceptors.response.use(
  (response) => {
    // 🔍 DEBUGGING: Log complete response details
    console.log('✅ [CLIENT RESPONSE]', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      headers: response.headers,
      data: response.data,
    });

    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response.data || {};
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // 🔍 DEBUGGING: Log complete error details
    console.error('❌ [ERROR]', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      requestData: error.config?.data,
      responseData: error.response?.data,
      headers: error.response?.headers,
    });

    // Do something with response error
    if (error.isAxiosError) {
      const { data } = error.response;
      const payload = new HttpErrorException(
        "tiendanubeApiClient - " + data?.message,
        data?.description
      );
      payload.setStatusCode(data?.code);
      return Promise.reject(payload);
    }

    return Promise.reject(error);
  }
);
