import React, {useState} from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import SMSList from './src/Sms';
import Notification from './src/Notification';

function App() {
  const [currentTab, setCurrentTab] = useState('SMS');

  const handleTabChange = tab => {
    setCurrentTab(tab);
  };

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
        {currentTab === 'SMS' ? <SMSList /> : <Notification />}
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
