import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

const Notification = ({
  currentPage,
  messagesPerPage,
  filteredMessages,
  loading,
  handleSearch,
  searchTerm,
  toggleLoading,
  toggleDump,
  setCurrentPage,
  notifications,
}) => {
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Your data is being pushed to the database. Please do not close the
            app.
          </Text>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <>
          <Text style={styles.title}>
            We are only listening to marketing notifications from companies and
            do not capture any of your personal or transactional messages.
          </Text>
          {/* <TextInput
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
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: message.read ? 'blue' : 'red',
                  }}>
                  {message.read ? 'Read' : 'Unread'}
                </Text>
                {toggleLoading === message?.time ? (
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
          </ScrollView> */}
          {/* <View style={styles.pagination}>
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
                indexOfLastMessage >= notifications.length &&
                  styles.disabledButton,
              ]}
              onPress={() => setCurrentPage(currentPage + 1)}
              disabled={indexOfLastMessage >= notifications.length}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View> */}
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
});

export default Notification;
