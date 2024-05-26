import SERVER_URL from '../config/server';
import {create} from 'apisauce';
import AsyncStorage from '@react-native-async-storage/async-storage';

const request = create({
  baseURL: SERVER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.addAsyncRequestTransform(async request => {
  let userToken = await AsyncStorage.getItem('userToken');

  if (!userToken) {
    try {
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

      // Parse the response
      const res = await response.json();
      userToken = res?.data?.token;
      await AsyncStorage.setItem('userToken', userToken);
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  if (userToken) {
    request.headers['jwttoken'] = `Bearer ${userToken}`;
  }
});

export default request;
