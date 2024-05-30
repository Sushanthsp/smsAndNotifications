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
import {deleteNotification, dumpNotification} from './src/service/api';
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
import DeviceInfo from 'react-native-device-info';

const appUniqueId = DeviceInfo.getAndroidId()?._j;

console.log('appUniqueId', appUniqueId);
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
  console.log(
    'notification------>',
    JSON.parse(notification)?.app,
    ' ',
    JSON.parse(notification)?.time,
  );

  if (notification) {
    const parsedText = JSON.parse(notification);

    const appMatch = cleanCompany(parsedText?.app);

    const containsUnwantedDetails = unwantedDetailsRegex.test(
      parsedText.text.toLowerCase(),
    );

    const containsUnwantedAppS = unwantedApps.test(
      parsedText.app.toLowerCase(),
    );

    console.log(
      '!containsUnwantedDetails && !containsUnwantedAppS && appMatch',
      !containsUnwantedDetails && !containsUnwantedAppS && appMatch,
    );

    if (!containsUnwantedDetails && !containsUnwantedAppS && appMatch) {
      const company = appMatch ? appMatch : parsedText?.title;
      let dateSent;
      try {
        if (parsedText?.time && !isNaN(Date.parse(parsedText.time))) {
          dateSent = new Date(parsedText.time).toISOString();
        } else {
          // Handle invalid date scenario
          console.error('Invalid date format:', parsedText?.time);
          dateSent = new Date().toISOString(); // Fallback to current date/time
        }
      } catch (err) {
        console.log('Err', err);
      }

      const savedNotifications =
        JSON.parse(await AsyncStorage.getItem('notifications')) || [];

      console.log('savedNotifications', savedNotifications);
      const isDuplicate = savedNotifications.some(
        savedNotification =>
          savedNotification.company === company &&
          savedNotification.dateSent === dateSent,
      );
      console.log('duplicate', isDuplicate);
      if (!isDuplicate) {
        const data = {
          company,
          message: parsedText?.text,
          arbitraryData: parsedText,
          dateSent,
          appUniqueId,
        };

        const res = await dumpNotificationFun(data);
        if (res?.status) {
          console.log('dumped');

          savedNotifications.push({company, dateSent});
          await AsyncStorage.setItem(
            'notifications',
            JSON.stringify(savedNotifications),
          );
        }
      } else {
        console.log('Notification already processed, ignoring.');
      }
    }
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
    delay: 100000,
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

  //sms

  const [messages, setMessages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);

  const [triggerSms, setTriggerSms] = useState(false);
  const requestSMSPermissions = async () => {
    try {
      const readSMSPermissionStatus = await check(PERMISSIONS.ANDROID.READ_SMS);
      console.log(
        'Current Read SMS permission status:',
        readSMSPermissionStatus,
      );
      setTriggerSms(!triggerSms);
      if (readSMSPermissionStatus !== RESULTS.GRANTED) {
        const readPermissionRequestResult = await request(
          PERMISSIONS.ANDROID.READ_SMS,
        );
        console.log(
          'Read SMS permission request result:',
          readPermissionRequestResult,
        );

        if (readPermissionRequestResult !== RESULTS.GRANTED) {
          console.log('Read SMS permission not granted');
        } else {
          console.log('Read SMS permission granted');
        }
      } else {
        console.log('Read SMS permission already granted');
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  useEffect(() => {
    const fetchAllSMS = async () => {
      try {
        await requestSMSPermissions();

        SmsAndroid.list(
          JSON.stringify({}),
          fail => {
            console.log('Failed with this error: ' + fail);
          },
          (count, smsList) => {
            const parsedMessages = JSON.parse(smsList);
            const messagesWithReadFlag = parsedMessages.map(message => ({
              ...message,
              read: false,
            }));

            setMessages(messagesWithReadFlag);
            setFilteredMessages(messagesWithReadFlag);
          },
        );
      } catch (error) {
        console.error('Error fetching SMS:', error);
      }
    };

    fetchAllSMS();
  }, []);

  const initializeSmsListener = async () => {
    const readSMSPermissionStatus = await check(PERMISSIONS.ANDROID.READ_SMS);
    console.log('readSMSPermissionStatus', readSMSPermissionStatus);

    if (readSMSPermissionStatus === RESULTS.GRANTED) {
      const subscription = SmsListener.addListener(async message => {
        console.info('message----->', message);

        const addressMatches = keywords.some(keyword =>
          message.address.toLowerCase().includes(keyword),
        );
        const bodyMatches = keywords.some(keyword =>
          message.body.toLowerCase().includes(keyword),
        );
        const containsUnwantedDetails = unwantedDetailsRegex.test(
          message.body.toLowerCase(),
        );

        if (!containsUnwantedDetails) {
          const data = {
            company: message?.address,
            message: message?.body,
            arbitraryData: message,
            serviceCenter: message?.service_center,
            dateSent: new Date(Number(message?.date_sent)),
          };
          setLoading(true);

          await dumpSmsFun(data);
          const newMessage = {...message, read: true};
          setMessages([newMessage, ...messages]);
          setFilteredMessages([newMessage, ...filteredMessages]);
          setLoading(false);
        } else {
          const newMessage = {...message, read: false};
          setMessages([newMessage, ...messages]);
          setFilteredMessages([newMessage, ...filteredMessages]);
        }
      });

      return () => {
        subscription.remove();
      };
    }
  };

  useEffect(() => {
    const checkAndRequestPermission = async () => {
      const readSMSPermissionStatus = await check(PERMISSIONS.ANDROID.READ_SMS);

      if (readSMSPermissionStatus === RESULTS.GRANTED) {
        initializeSmsListener();
      }
    };

    let timeOut = setTimeout(() => {
      checkAndRequestPermission();
    }, 3000);

    return () => {
      clearTimeout(timeOut);
    };
  }, [triggerSms]);

  const handleSearch = text => {
    setSearchTerm(text);
    const filtered = messages.filter(
      message =>
        message?.address.toLowerCase()?.includes(text.toLowerCase()) ||
        message?.body.toLowerCase()?.includes(text.toLowerCase()) ||
        message?.serviceCenter?.toLowerCase().includes(text.toLowerCase()),
    );
    setFilteredMessages(filtered);
  };

  const dumpSmsFun = async data => {
    try {
      const res = await dumpSms(data);
      console.log('res', res);
      return res;
    } catch (err) {
      console.log('err', err);
    }
  };

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [readSms, setReadSms] = useState(false);

  const pushData = async () => {
    try {
      const pushedData = await AsyncStorage.getItem('pushedData');
      console.log('pushedData', pushedData);
      if (!pushedData) {
        const filteredMessages = messages.filter(message => {
          const messageBody = message.body.toLowerCase();
          const messageAddress = message.address.toLowerCase();

          return !unwantedDetailsRegex.test(messageBody);
          // (keywords.some(keyword => messageBody.includes(keyword)) ||
          //   keywords.some(keyword => messageAddress.includes(keyword)))
        });

        if (filteredMessages.length === 0) {
          console.log('No messages to push');
          return;
        }

        setLoading(true);

        for (let i = 0; i < filteredMessages.length; i++) {
          const message = filteredMessages[i];
          const data = {
            company: message?.address,
            message: message?.body,
            arbitraryData: message,
            serviceCenter: message?.service_center,
            dateSent: new Date(Number(message?.date_sent)),
          };

          await dumpSmsFun(data);

          // Update the read flag for the message after dumping it
          message.read = true;

          // Calculate progress
          setProgress((i + 1) / filteredMessages.length);
        }

        // Update the state with the modified messages
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            filteredMessages.some(fm => fm._id === msg._id)
              ? {...msg, read: true}
              : msg,
          ),
        );
        setFilteredMessages(prevMessages =>
          prevMessages.map(msg =>
            filteredMessages.some(fm => fm._id === msg._id)
              ? {...msg, read: true}
              : msg,
          ),
        );
        setLoading(false);

        await AsyncStorage.setItem('pushedData', 'true');
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching or filtering messages:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      pushData();
    }, 5000);

    return () => clearTimeout(timer);
  }, [messages]);

  const [toggleLoading, setToggleLoading] = useState('');

  const toggleDump = async message => {
    if (toggleLoading) return;
    try {
      setToggleLoading(message?.date);
      if (message?.read) {
        const res = await deleteSms({
          company: message?.address,
          dateSent: new Date(message?.date),
          serviceCenter: message?.serviceCenter,
        });
        if (res?.status) {
          // Implement the function to toggle the dump flag and update the state accordingly
          const updatedMessages = messages.map(msg =>
            msg._id === message._id ? {...msg, read: !msg.read} : msg,
          );
          setMessages(updatedMessages);
          setFilteredMessages(updatedMessages);
        } else {
          Snackbar.show({
            text: res?.message,
            duration: 5000,
            textColor: 'red',
          });
          await removeToken(res);
        }
      } else {
        const data = {
          company: message?.address,
          message: message?.body,
          arbitraryData: message,
          serviceCenter: message?.service_center,
          dateSent: new Date(message?.date),
        };
        const res = await dumpSmsFun(data);
        if (res?.status) {
          const updatedMessages = messages.map(msg =>
            msg._id === message._id ? {...msg, read: !msg.read} : msg,
          );
          setMessages(updatedMessages);
          setFilteredMessages(updatedMessages);
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
      setToggleLoading('');
    }
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
          appUniqueId,
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
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            currentTab === 'SMS' ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => handleTabChange('SMS')}>
          <Text
            style={[
              currentTab === 'SMS' ? styles.activeTabText : styles.tabText,
            ]}>
            SMS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            currentTab === 'Notification'
              ? styles.activeTab
              : styles.inactiveTab,
          ]}
          onPress={() => handleTabChange('Notification')}>
          <Text
            style={[
              currentTab === 'Notification'
                ? styles.activeTabText
                : styles.tabText,
            ]}>
            Notification
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {currentTab === 'SMS' ? (
          <SMSList
            currentPage={currentPage}
            messagesPerPage={messagesPerPage}
            filteredMessages={filteredMessages}
            loading={loading}
            progress={progress}
            handleSearch={handleSearch}
            searchTerm={searchTerm}
            toggleLoading={toggleLoading}
            toggleDump={toggleDump}
            messages={messages}
            setCurrentPage={setCurrentPage}
            setReadSms={setReadSms}
            readSms={readSms}
          />
        ) : (
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
        )}
      </View>
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
