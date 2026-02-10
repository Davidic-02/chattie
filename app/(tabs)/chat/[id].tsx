import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import ChatHeader from '../../../components/chat/ChatHeader';
import StaffCard from '../../../components/ui/StaffCard';
import MessageBubble from '../../../components/ui/chatMessage';
import InputBox from '../../../components/ui/inputBox';

export default function ChatScreen() {
  const [messages, setMessages] = useState<{ id: string; text: string; isMe: boolean }[]>([]);

  const staff = {
    name: 'Jane Doe',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    role: 'Designer',
  };

  // Called when user sends a new message
  const handleSend = (text: string) => {
    setMessages(prev => [...prev, { id: String(prev.length), text, isMe: true }]);
    // Here we can later add Firebase logic to send messages to DB
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ChatHeader title={staff.name} />

      {/* Staff card */}
      <StaffCard name={staff.name} avatar={staff.avatar} role={staff.role} />

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble message={item.text} isMe={item.isMe} />}
        style={styles.messagesList}
      />

      {/* Input box */}
      <InputBox onSend={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
});
