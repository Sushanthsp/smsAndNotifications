import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  AppState,
  PermissionsAndroid,
  DeviceEventEmitter,
} from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import {check, PERMISSIONS, request} from 'react-native-permissions';
import BackgroundService from 'react-native-background-actions';
import SmsListener from 'react-native-android-sms-listener';
import {dumpSms} from './service/api';
import {keywords, unwantedDetailsRegex} from './constants/filter';
import AsyncStorage from '@react-native-async-storage/async-storage';

const sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));

const veryIntensiveTask = async taskDataArguments => {
  const {delay} = taskDataArguments;
  for (let i = 0; BackgroundService.isRunning(); i++) {
    await BackgroundService.updateNotification({
      taskDesc: 'task running ' + i,
    });

    await sleep(delay);
  }
};

const options = {
  taskName: 'Example',
  taskTitle: 'ExampleTask title',
  taskDesc: 'ExampleTask description',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  parameters: {
    delay: 2000,
  },
};

const startBackgroundService = async () => {
  await BackgroundService.start(veryIntensiveTask, options);
};

const stopBackgroundService = async () => {
  await BackgroundService.stop();
};

const SMSList = () => {
  const [messages, setMessages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);

  const requestSMSPermissions = async () => {
    try {
      const readSMSPermissionStatus = await check(PERMISSIONS.ANDROID.READ_SMS);
      const writeSMSPermissionStatus = await check(
        PERMISSIONS.ANDROID.WRITE_SMS,
      );

      if (readSMSPermissionStatus !== 'granted') {
        const readPermissionRequestResult = await request(
          PERMISSIONS.ANDROID.READ_SMS,
        );
        if (readPermissionRequestResult !== 'granted') {
          console.log('Read SMS permission not granted');
        }
      }

      if (writeSMSPermissionStatus !== 'granted') {
        const writePermissionRequestResult = await request(
          PERMISSIONS.ANDROID.WRITE_SMS,
        );
        if (writePermissionRequestResult !== 'granted') {
          console.log('Write SMS permission not granted');
        }
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
            setMessages(parsedMessages);
            setFilteredMessages(parsedMessages);
          },
        );
      } catch (error) {
        console.error('Error fetching SMS:', error);
      }
    };

    fetchAllSMS();
  }, []);

  const requestSmsPermission = async () => {
    try {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      );
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    requestSmsPermission();
    SmsListener.addListener(async message => {
      console.info('message----->', message);

      const addressMatches = keywords.some(keyword =>
        message.originatingAddress.toLowerCase().includes(keyword),
      );
      const bodyMatches = keywords.some(keyword =>
        message.body.toLowerCase().includes(keyword),
      );
      const containsUnwantedDetails = unwantedDetailsRegex.test(message.body);

      if ((addressMatches || bodyMatches) && !containsUnwantedDetails) {
        const data = {
          company: message?.address + ' - ' + message?.service_center,
          message: message?.body,
          arbitraryData: message,
        };
        await dumpSmsFun(data);
      }
    });
  }, []);

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

  const indexOfLastMessage = currentPage * messagesPerPage;
  const indexOfFirstMessage = indexOfLastMessage - messagesPerPage;
  const currentMessages = filteredMessages.slice(
    indexOfFirstMessage,
    indexOfLastMessage,
  );

  const [taskActive, setTaskActive] = useState(false);
  const toggleTask = () => {
    if (taskActive) {
      stopBackgroundService();
    } else {
      startBackgroundService();
    }
    setTaskActive(!taskActive);
  };

  // useEffect(() => {
  //   const handleAppStateChange = nextAppState => {
  //     console.log('nextAppState', nextAppState);
  //     if (nextAppState === 'background') {
  //       startBackgroundService();
  //     } else if (nextAppState === 'active') {
  //       stopBackgroundService();
  //     }
  //   };

  //   const subscribeToAppStateChanges = () => {
  //     AppState.addEventListener('change', handleAppStateChange);
  //   };

  //   subscribeToAppStateChanges();

  //   return () => {
  //     subscribeToAppStateChanges();
  //   };
  // }, []);

  const dumpSmsFun = async data => {
    try {
      const res = await dumpSms(data);
      console.log('res', res);
    } catch (err) {
      console.log('err', err);
    }
  };

  const pushData = async () => {
    try {
      let pushedData = await AsyncStorage.getItem('pushedData');

      if (!pushedData) {
        const filteredMessages = messages.filter(message => {
          const addressMatches = keywords.some(keyword =>
            message.address.toLowerCase().includes(keyword),
          );
          const bodyMatches = keywords.some(keyword =>
            message.body.toLowerCase().includes(keyword),
          );
          const containsUnwantedDetails = unwantedDetailsRegex.test(
            message.body,
          );

          return (addressMatches || bodyMatches) && !containsUnwantedDetails;
        });

        for (const message of filteredMessages) {
          const data = {
            company: message?.address + ' - ' + message?.service_center,
            message: message?.body,
            arbitraryData: message,
          };
          await dumpSmsFun(data);
        }
        await AsyncStorage.setItem('pushedData', 'true');
      }
    } catch (error) {
      console.error('Error fetching or filtering messages:', error);
    }
  };
  useEffect(() => {
    if (messages?.length > 0) {
      pushData();
    }
  }, [messages]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>List of SMS Messages</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        onChangeText={handleSearch}
        value={searchTerm}
      />
      <ScrollView style={styles.messageContainer}>
        {currentMessages.map((message, index) => (
          <View key={index} style={styles.message}>
            <Text style={styles.messageDate}>
              {new Date(message.date).toString()}
            </Text>
            <Text style={styles.messageAddress}>{message.address}</Text>
            <Text style={styles.messageText}>{message.body}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === 1 && styles.disabledButton,
          ]}
          onPress={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}>
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.pageText}>Page {currentPage}</Text>
        <TouchableOpacity
          style={[
            styles.pageButton,
            indexOfLastMessage >= messages.length && styles.disabledButton,
          ]}
          onPress={() => setCurrentPage(currentPage + 1)}
          disabled={indexOfLastMessage >= messages.length}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
      {/* <View style={styles.mt}>
        <TouchableOpacity style={[styles.pageButton]} onPress={toggleTask}>
          <Text style={styles.buttonText}>Toggle task</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  searchInput: {
    width: 300,
    borderRadius: 10,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  messageContainer: {
    width: '100%',
    marginBottom: 20,
  },
  message: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  messageDate: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  messageText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 5,
  },
  messageAddress: {
    fontSize: 18,
    color: '#444',
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageText: {
    fontSize: 18,
    color: '#333',
    marginHorizontal: 10,
  },
  pageButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
  },
  mt: {
    marginTop: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default SMSList;
