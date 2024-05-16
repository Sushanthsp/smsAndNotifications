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
} from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import {check, PERMISSIONS, request} from 'react-native-permissions';

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
            setFilteredMessages(parsedMessages); // Initialize filtered messages with all messages
          },
        );
      } catch (error) {
        console.error('Error fetching SMS:', error);
      }
    };

    fetchAllSMS();

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Function to handle search
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

  // Calculate index of the last message to be displayed on the current page
  const indexOfLastMessage = currentPage * messagesPerPage;
  // Calculate index of the first message to be displayed on the current page
  const indexOfFirstMessage = indexOfLastMessage - messagesPerPage;
  // Slice the messages array to get messages for the current page
  const currentMessages = filteredMessages.slice(
    indexOfFirstMessage,
    indexOfLastMessage,
  );

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

export default SMSList;
