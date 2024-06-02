import SERVER_URL from '../config/server';
import {create} from 'apisauce';
import AsyncStorage from '@react-native-async-storage/async-storage';

const request = create({
  baseURL: SERVER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const refreshAccessToken = async (refreshToken, userId) => {
  try {
    const response = await fetch(`${SERVER_URL}/auth/refreshToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
        id: userId,
      }),
    });

    const res = await response.json();
    const newAccessToken = res?.data?.token;
   
    if (newAccessToken) await AsyncStorage.setItem('userToken', newAccessToken);

    return newAccessToken;
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    throw error;
  }
};

request.addAsyncRequestTransform(async request => {
  const userToken = await AsyncStorage.getItem('userToken');

  if (userToken) {
    request.headers['jwttoken'] = `Bearer ${userToken}`;
  } else {
    const response = await fetch(`${SERVER_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test.app',
        password: 'FG432sdm90',
      }),
    });

    const res = await response.json();
    const newToken = res?.data?.token;
    await AsyncStorage.setItem('userToken', newToken);
    await AsyncStorage.setItem('refreshToken', res?.data?.refreshToken);
    await AsyncStorage.setItem('userId', res?.data?._id);

    request.headers['jwttoken'] = `Bearer ${newToken}`;
  }
});

request.axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            const userId = await AsyncStorage.getItem('userId');

            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const newAccessToken = await refreshAccessToken(
              refreshToken,
              userId,
            );
            processQueue(null, newAccessToken);

            originalRequest.headers['jwttoken'] = `Bearer ${newAccessToken}`;
            return request.axiosInstance(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);

            if (
              refreshError.message
                .toLowerCase()
                .includes('invalid refreshtoken')
            ) {
              await AsyncStorage.clear(); // or any other action to log out the user
              console.error('Refresh token is invalid, logging out the user.');
            }

            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            originalRequest.headers['jwttoken'] = `Bearer ${token}`;
            return request.axiosInstance(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }
    }

    return Promise.reject(error);
  },
);

export default request;
