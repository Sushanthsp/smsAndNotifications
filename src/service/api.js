import request from './request';

export const login = data => {
  return new Promise(async (resolve, reject) => {
    await request
      .post('/auth/login', data)
      .then(res => {
        resolve(res.data);
      })
      .catch(e => {
        reject(e);
      });
  });
};

export const dumpSms = data => {
  return new Promise(async (resolve, reject) => {
    await request
      .post('/dataAggregator/sms', data)
      .then(res => {
        resolve(res.data);
      })
      .catch(e => {
        reject(e);
      });
  });
};

export const deleteSms = data => {
  return new Promise(async (resolve, reject) => {
    await request
      .post('/dataAggregator/deleteSms', data)
      .then(res => {
        resolve(res.data);
      })
      .catch(e => {
        reject(e);
      });
  });
};
export const dumpNotification = data => {
  return new Promise(async (resolve, reject) => {
    await request
      .post('/dataAggregator/notification', data)
      .then(res => {
        resolve(res.data);
      })
      .catch(e => {
        reject(e);
      });
  });
};
export const deleteNotification = data => {
  return new Promise(async (resolve, reject) => {
    await request
      .post('/dataAggregator/deleteNotification', data)
      .then(res => {
        resolve(res.data);
      })
      .catch(e => {
        reject(e);
      });
  });
};
