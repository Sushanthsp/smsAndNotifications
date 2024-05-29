import React, {useEffect} from 'react';
import {Alert, View, Text} from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import PushNotification from 'react-native-push-notification';

const App = () => {
  useEffect(() => {
    // Configure Background Fetch
    BackgroundFetch.configure(
      {
        minimumFetchInterval: 1,
        stopOnTerminate: false,
        startOnBoot: true,
      },
      async taskId => {
        console.log('[BackgroundFetch] taskId: ', taskId);

        // Check for new notifications here, for example, fetch from an API
        // Assuming you fetch notifications and they are in the variable `newNotifications`
        const newNotifications = await fetchNewNotifications();

        newNotifications.forEach(notification => {
          PushNotification.localNotification({
            title: notification.title,
            message: notification.message,
          });
        });

        BackgroundFetch.finish(taskId);
      },
      error => {
        console.log('[BackgroundFetch] configure error: ', error);
      },
    );

    // Optional: Query the current BackgroundFetch status.
    BackgroundFetch.status(status => {
      switch (status) {
        case BackgroundFetch.STATUS_RESTRICTED:
          console.log('BackgroundFetch restricted');
          break;
        case BackgroundFetch.STATUS_DENIED:
          console.log('BackgroundFetch denied');
          break;
        case BackgroundFetch.STATUS_AVAILABLE:
          console.log('BackgroundFetch is enabled');
          break;
      }
    });

    // Configure Push Notifications
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
      senderID: 'YOUR GCM (OR FCM) SENDER ID',
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });
  }, []);

  const fetchNewNotifications = async () => {
    // Your logic to fetch new notifications
    return [{title: 'New Alert', message: 'You have a new notification!'}];
  };

  return (
    <View>
      <Text>text</Text>
    </View>
  );
};

export default App;
