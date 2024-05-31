import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  AppState,
  AppRegistry,
  BackHandler,
} from 'react-native';
import SMSList from './src/Sms';
import Notification from './src/Notification';
import {
  deleteNotification,
  dumpNotification,
  ignoredNotification,
} from './src/service/api';
import {
  keywords,
  unwantedApps,
  unwantedCompanies,
  unwantedDetailsRegex,
} from './src/constants/filter';
import RNAndroidNotificationListener, {
  RNAndroidNotificationListenerHeadlessJsName,
} from 'react-native-android-notification-listener';
import SmsAndroid from 'react-native-get-sms-android';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import BackgroundService from 'react-native-background-actions';
import SmsListener from 'react-native-android-sms-listener';
import {deleteSms, dumpSms} from './src/service/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Snackbar from 'react-native-snackbar';

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const dumpNotificationFun = async data => {
  try {
    console.log('data----->', data);
    const res = await dumpNotification(data);
    console.log('res', res);
    return res;
  } catch (err) {
    console.log('err', err);
  } finally {
  }
};

const headlessNotificationListener = async ({notification}) => {
  try {
    const parsedNotification = JSON.parse(notification);

    const appMatch = cleanCompany(parsedNotification?.app);

    const containsUnwantedDetails = unwantedDetailsRegex.test(
      parsedNotification.text.toLowerCase(),
    );

    const containsUnwantedAppS = unwantedApps.test(
      parsedNotification.app.toLowerCase(),
    );

    console.log(
      '!containsUnwantedDetails && !containsUnwantedAppS && appMatch',
      !containsUnwantedDetails && !containsUnwantedAppS && appMatch,
    );

    if (!containsUnwantedDetails && !containsUnwantedAppS && appMatch) {
      const company = appMatch ? appMatch : parsedNotification?.title;
      let dateSent;

      if (
        parsedNotification?.time &&
        !isNaN(Date.parse(parsedNotification.time))
      ) {
        dateSent = new Date(parsedNotification.time).toISOString();
      } else {
        // Handle invalid date scenario
        console.error('Invalid date format:', parsedNotification?.time);
        dateSent = new Date().toISOString(); // Fallback to current date/time
      }

      const res = await dumpNotificationFun({
        company,
        message: parsedNotification?.text,
        arbitraryData: parsedNotification,
        dateSent,
        appUniqueId: 'testing123',
      });
      if (res?.status) {
        console.log('Notification successfully dumped');
      } else {
        console.error('Failed to dump notification', res);
        await ignoredNotification({
          arbitraryData: parsedNotification,
          type: 'api-fail',
        });
      }
    } else {
      console.log('Notification ignored due to unwanted details or apps');
      await ignoredNotification({
        arbitraryData: parsedNotification,
        type: 'ignored',
      });
    }
  } catch (error) {
    console.error('Error in headlessNotificationListener:', error);

    let parsedNotification;
    try {
      parsedNotification = JSON.parse(notification);
    } catch (parseError) {
      console.error('Failed to parse notification:', parseError);
      parsedNotification = {
        text: 'Failed to parse notification',
        type: 'error',
      };
    }

    await ignoredNotification({
      arbitraryData: parsedNotification,
      type: 'error',
      error: error?.toString(),
    });
  }
};

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
    delay: 1000000,
  },
};

const fetchNewNotifications = async i => {
  await BackgroundService.updateNotification({
    taskDesc: 'Checking for new notifications',
  });
};

const cleanCompany = company => {
  const pattern = new RegExp(`\\b(${unwantedCompanies.join('|')})\\b`, 'gi');

  // Remove unwanted substrings from the company string
  const cleaned = company
    .replace(pattern, '')
    .replace(/(^\.|\.$)/g, '')
    .trim();

  // Split the remaining string into parts by periods
  const parts = cleaned.split('.').filter(part => part);

  // If nothing remains or it matches an unwanted company, return an empty string
  if (!cleaned || parts.length === 0 || unwantedCompanies.includes(cleaned)) {
    return '';
  }

  // Reconstruct the string to the format "before.x.y"
  return parts.join('.');
};

function App() {
  const removeToken = async res => {
    if (
      res.message === 'Invalid token!' ||
      res.message === 'You are not authorized' ||
      res.message === 'You are not authorized to perform this action' ||
      res.message === 'Invalid token or expired!'
    ) {
      console.log('removing token');
      await AsyncStorage.removeItem('userToken');
    }
  };
  const [currentTab, setCurrentTab] = useState('SMS');

  const handleTabChange = tab => {
    setCurrentTab(tab);
  };

  //notification

  const [notifications, setNotifications] = useState([]);
  const [currentNotificationPage, setNotificationCurrentPage] = useState(1);
  const [messagesNotificationPerPage] = useState(10);
  const [searchNotificationTerm, setSearchNotificationTerm] = useState('');
  const [filteredNotificationMessages, setFilteredNotificationMessages] =
    useState([]);
  const [Notificationloading, setNotificationLoading] = useState(false);
  const [toggleNotificationLoading, setNotificationToggleLoading] =
    useState('');

  const dumpNotificationFun2 = async data => {
    try {
      console.log('data----->', data);
      const res = await dumpNotification(data);
      console.log('res', res);
      return res;
    } catch (err) {
      console.log('err', err);
    } finally {
      setNotificationToggleLoading(false);
    }
  };

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

  const handleNotificationSearch = text => {
    setSearchNotificationTerm(text);
    const filtered = notifications.filter(
      message =>
        message?.text.toLowerCase()?.includes(text.toLowerCase()) ||
        message?.title?.toLowerCase().includes(text.toLowerCase()),
    );
    setFilteredNotificationMessages(filtered);
  };

  const toggleNotificationDump = async message => {
    if (toggleLoading) return;
    try {
      setNotificationToggleLoading(message?.time);
      if (message?.read) {
        const appMatch = cleanCompany(message?.app);

        console.log(
          'appMatch ? appMatch : message?.title',
          appMatch ? appMatch : message?.title,
        );
        const res = await deleteNotification({
          company: appMatch ? appMatch : message?.title,
          dateSent: new Date(Number(message?.time)),
        });
        console.log('res', message?.title);
        if (res?.status) {
          const updatedMessages = notifications.map(msg =>
            msg.time === message.time ? {...msg, read: !msg.read} : msg,
          );
          setNotifications(updatedMessages);
          setFilteredNotificationMessages(updatedMessages);
        } else {
          Snackbar.show({
            text: res?.message,
            duration: 5000,
            textColor: 'red',
          });
          await removeToken(res);
        }
      } else {
        const appMatch = cleanCompany(message?.app);

        const data = {
          company: appMatch ? appMatch : message?.title,
          message: message?.text,
          arbitraryData: message,
          dateSent: new Date(Number(message?.time)),
        };
        const res = await dumpNotificationFun2(data);
        if (res?.status) {
          const updatedMessages = notifications.map(msg =>
            msg.time === message.time ? {...msg, read: !msg.read} : msg,
          );
          setNotifications(updatedMessages);
          setFilteredNotificationMessages(updatedMessages);
        } else {
          Snackbar.show({
            text: res?.message,
            duration: 5000,
            textColor: 'red',
          });
          await removeToken(res);
        }
      }
    } catch (error) {
      console.error('Error toggling dump:', error);
    } finally {
      setNotificationToggleLoading('');
    }
  };

  //app notification
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      console.log('nextAppState', nextAppState);
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
      } else if (nextAppState === 'background') {
        console.log('App has gone to the background!');
        // Here you can schedule a notification
      }

      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [appState]);

  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        'Hold on!',
        'Are you sure you want to close the App, this will stop listening to notifications?',
        [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          {text: 'YES', onPress: () => BackHandler.exitApp()},
        ],
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Notification
        currentPage={currentNotificationPage}
        messagesPerPage={messagesNotificationPerPage}
        filteredMessages={filteredNotificationMessages}
        loading={Notificationloading}
        handleSearch={handleNotificationSearch}
        searchTerm={searchNotificationTerm}
        toggleLoading={toggleNotificationLoading}
        toggleDump={toggleNotificationDump}
        setCurrentPage={setNotificationCurrentPage}
        notifications={notifications}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20, // To give space from top
    paddingBottom: 20, // To give space from bottom
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Aligning tabs at the ends
    paddingHorizontal: 20, // Margin from both sides
    marginBottom: 10, // Space between tabs and content
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, // Adding border
    borderColor: '#007bff', // Default border color
    borderRadius: 10, // Rounded corners
    paddingVertical: 10,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#007bff', // Background color for active tab
  },
  inactiveTab: {
    backgroundColor: '#fff',
    color: '#000',
  },
  activeTabText: {
    color: '#fff',
  },
  tabText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
