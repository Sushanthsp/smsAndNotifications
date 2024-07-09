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

const Notification = ({loading}) => {
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
          <Text style={styles.title}>Notifications</Text>

          <Text style={styles.notificationInfo}>
            We are only listening to marketing notifications from companies and
            do not capture any of your personal or transactional messages.
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  searchInput: {
    width: '100%',
    borderRadius: 10,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  notificationInfo: {
    fontSize: 15,
    marginBottom: 20,
    color: 'red',
    textAlign: 'center',
  },
  messageContainer: {
    flex: 1,
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
    marginTop: 20,
  },
  pageButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  pageText: {
    fontSize: 18,
    color: '#333',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default Notification;
