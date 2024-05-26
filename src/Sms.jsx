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
  ActivityIndicator,
  AppRegistry,
} from 'react-native';

import {ProgressBar} from '@react-native-community/progress-bar-android';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SMSList = ({
  currentPage,
  messagesPerPage,
  filteredMessages,
  loading,
  progress,
  handleSearch,
  searchTerm,
  toggleLoading,
  toggleDump,
  messages,
  setCurrentPage,
  setReadSms,
  readSms,
}) => {
  const indexOfLastMessage = currentPage * messagesPerPage;
  const indexOfFirstMessage = indexOfLastMessage - messagesPerPage;
  const currentMessages = filteredMessages.slice(
    indexOfFirstMessage,
    indexOfLastMessage,
  );
  const [pressed, setPressed] = useState(false);

  // Check if 'pushedData' is in AsyncStorage
  useEffect(() => {
    const checkPushedData = async () => {
      const pushedData = await AsyncStorage.getItem('pushedData');
      setPressed(pushedData === 'true');
    };

    checkPushedData();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Your data is being pushed to the database. Please do not close the
            app.
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <ProgressBar
                styleAttr="Horizontal"
                indeterminate={false}
                progress={progress}
                color="#007bff"
              />
              <ActivityIndicator size="large" color="#007bff" />
            </View>
          </View>
        </View>
      ) : (
        <>
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
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: message.read ? 'blue' : 'red',
                  }}>
                  {message.read ? 'Read' : 'Unread'}
                </Text>
                {toggleLoading === message?.date ? (
                  <ActivityIndicator size="small" color="#0000ff" />
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      message.read
                        ? styles.unarchiveButton
                        : styles.archiveButton,
                    ]}
                    onPress={() => toggleDump(message)}>
                    <Text style={styles.buttonText}>
                      {message.read ? 'Unarchive' : 'Archive'}
                    </Text>
                  </TouchableOpacity>
                )}
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

            {(!pressed) && (
              <TouchableOpacity
                style={styles.stopIcon}
                onPress={async () => {
                  await AsyncStorage.setItem('pushedData', 'true');
                  setPressed(true);
                }}>
                <Icon name="power-off" size={30} color="red" />
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
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
    fontSize: 15,
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
  button: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  archiveButton: {
    backgroundColor: '#28a745',
  },
  unarchiveButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
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
  mt: {
    marginTop: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    marginRight: 10,
  },
  stopIcon: {
    marginLeft: 10,
  },
  powerIcon: {
    marginTop: 10,
  },
});

export default SMSList;
