import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  AppRegistry,
  TouchableOpacity,
  TextInput,
  Alert,
  AppState,
} from 'react-native';
import RNAndroidNotificationListener, {
  RNAndroidNotificationListenerHeadlessJsName,
} from 'react-native-android-notification-listener';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);

  const headlessNotificationListener = async ({notification}) => {
    if (notification) {
      const parsedText = JSON.parse(notification);
      setNotifications(prevNotifications => [parsedText, ...prevNotifications]);
      setFilteredMessages(prevNotifications => [
        parsedText,
        ...prevNotifications,
      ]);
    }
  };

  // Register the headless task for notification listener
  AppRegistry.registerHeadlessTask(
    RNAndroidNotificationListenerHeadlessJsName,
    () => headlessNotificationListener,
  );

  // Check if the user has permission for notification listener
  const checkPermission = async () => {
    try {
      const status = await RNAndroidNotificationListener.getPermissionStatus();
      console.log('Permission status:', status); // Result can be 'authorized', 'denied', or 'unknown'

      // If permission is not granted, request permission
      if (status === 'unknown' || status === 'denied') {
        RNAndroidNotificationListener.requestPermission();
      }
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  checkPermission();

  // Calculate index of the last message to be displayed on the current page
  const indexOfLastMessage = currentPage * messagesPerPage;
  // Calculate index of the first message to be displayed on the current page
  const indexOfFirstMessage = indexOfLastMessage - messagesPerPage;
  // Slice the messages array to get messages for the current page
  const currentMessages = filteredMessages.slice(
    indexOfFirstMessage,
    indexOfLastMessage,
  );

  const handleSearch = text => {
    setSearchTerm(text);
    const filtered = notifications.filter(
      message =>
        message?.text.toLowerCase()?.includes(text.toLowerCase()) ||
        message?.body.toLowerCase()?.includes(text.toLowerCase()) ||
        message?.title?.toLowerCase().includes(text.toLowerCase()),
    );
    setFilteredMessages(filtered);
  };

  console.log('currentMessages', currentMessages);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>List of Notifications</Text>
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
              {new Date(Number(message.time)).toString()}
            </Text>
            <Text style={styles.messageAddress}>{message?.title}</Text>
            <Text style={styles.messageText}>{message?.text}</Text>
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
            indexOfLastMessage >= notifications.length && styles.disabledButton,
          ]}
          onPress={() => setCurrentPage(currentPage + 1)}
          disabled={indexOfLastMessage >= notifications.length}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
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
  disabledButton: {
    opacity: 0.5,
  },
});

export default Notification;
