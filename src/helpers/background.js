import React, {useEffect} from 'react';
import {View, Text, StyleSheet, AppRegistry} from 'react-native';
import BackgroundService from 'react-native-background-actions';
import RNAndroidNotificationListener, {
  RNAndroidNotificationListenerHeadlessJsName,
} from 'react-native-android-notification-listener';

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

// Define the intensive task
const task = async taskDataArguments => {
  const {delay} = taskDataArguments;
  await new Promise(async resolve => {
    let i = 0;
    while (BackgroundService.isRunning()) {
      console.log('Running background task');
      AppRegistry.registerHeadlessTask(
        RNAndroidNotificationListenerHeadlessJsName,
        () => headlessNotificationListener,
      );
      // Check for new notifications here, for example, fetch from an API
      await fetchNewNotifications(i);
      i++;
      await sleep(delay);
    }
    resolve();
  });
};

const options = {
  taskName: 'NotificationTask',
  taskTitle: 'Notification Service',
  taskDesc: 'Fetching notifications in the background',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'yourSchemeHere://chat/jane',
  parameters: {
    delay: 100000,
  },
};

const fetchNewNotifications = async i => {
  console.log('run task here');

  await BackgroundService.updateNotification({
    taskDesc: 'Checking for new notifications ' + i,
  });
};

const headlessNotificationListener = async ({notification}) => {
  console.log('notification------>', notification);
};

function App() {
  const checkPermission = async () => {
    try {
      const status = await RNAndroidNotificationListener.getPermissionStatus();
      console.log('Permission status:', status);
      if (status === 'unknown' || status === 'denied') {
        RNAndroidNotificationListener.requestPermission();
      }
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  useEffect(() => {
    checkPermission();
    const startBackgroundService = async () => {
      await BackgroundService.start(task, options);
    };

    startBackgroundService();
  }, []);

  AppRegistry.registerHeadlessTask(
    RNAndroidNotificationListenerHeadlessJsName,
    () => headlessNotificationListener,
  );

  return (
    <View style={styles.container}>
      <Text>Notification</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
