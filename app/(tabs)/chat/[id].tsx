import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { UserModel } from '../../../models/userModel';
import { FirebaseDataService } from '../../../services/dataServices';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
}

const getChatId = (user1Id: string, user2Id: string): string => {
  return user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = auth().currentUser!;
  const dataService = new FirebaseDataService();

  const [otherUser, setOtherUser] = useState<UserModel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatId = otherUser ? getChatId(currentUser.uid, otherUser.uid) : '';

  // Fetch other user's data
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      
      try {
        const { users } = await dataService.getUsersByIds([id]);
        setOtherUser(users[id]);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  useEffect(() => {
    if (!otherUser) return;

    // Mark messages as read
    markMessagesAsRead();

    // Listen to messages
    const unsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as Message[];
        setMessages(msgs);
      });

    // Listen to typing status
    const typingUnsubscribe = firestore()
      .collection('users')
      .doc(otherUser.uid)
      .onSnapshot(doc => {
        setIsTyping(doc.data()?.isTyping || false);
      });

    return () => {
      unsubscribe();
      typingUnsubscribe();
      // Set typing to false on unmount
      firestore().collection('users').doc(currentUser.uid).update({ isTyping: false });
    };
  }, [otherUser]);

  const markMessagesAsRead = async () => {
    if (!otherUser) return;

    const unreadMessages = await firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .where('receiverId', '==', currentUser.uid)
      .where('isRead', '==', false)
      .get();

    const batch = firestore().batch();
    unreadMessages.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });

    if (!unreadMessages.empty) {
      await batch.commit();
    }

    // Reset unread count
    await firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('recentChats')
      .doc(otherUser.uid)
      .update({ unreadCount: 0 });
  };

  const handleTyping = (text: string) => {
    setMessageText(text);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Update typing status
    firestore()
      .collection('users')
      .doc(currentUser.uid)
      .update({ isTyping: text.trim().length > 0 });

    // Set timeout to reset typing status
    typingTimeoutRef.current = setTimeout(() => {
      firestore().collection('users').doc(currentUser.uid).update({ isTyping: false });
    }, 2000);
  };

  const sendMessage = async () => {
    if (messageText.trim() === '' || !otherUser) return;

    const text = messageText.trim();
    setMessageText('');

    // Stop typing indicator
    await firestore().collection('users').doc(currentUser.uid).update({ isTyping: false });

    try {
      // Add message
      await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add({
          senderId: currentUser.uid,
          receiverId: otherUser.uid,
          text,
          timestamp: firestore.FieldValue.serverTimestamp(),
          isRead: false,
        });

      // Update recent chats for sender
      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('recentChats')
        .doc(otherUser.uid)
        .set({
          senderId: currentUser.uid,
          receiverId: otherUser.uid,
          text,
          timestamp: firestore.FieldValue.serverTimestamp(),
          unreadCount: 0,
        });

      // Update recent chats for receiver
      const receiverChatRef = firestore()
        .collection('users')
        .doc(otherUser.uid)
        .collection('recentChats')
        .doc(currentUser.uid);

      const receiverChatDoc = await receiverChatRef.get();
      const currentUnreadCount = receiverChatDoc.exists()
        ? receiverChatDoc.data()?.unreadCount || 0
        : 0;

      await receiverChatRef.set({
        senderId: currentUser.uid,
        receiverId: otherUser.uid,
        text,
        timestamp: firestore.FieldValue.serverTimestamp(),
        unreadCount: currentUnreadCount + 1,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
    } else if (messageDate.getTime() === today.getTime() - 86400000) {
      return 'Yesterday';
    } else {
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === currentUser.uid;

    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!otherUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>User not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{otherUser.name}</Text>
        {isTyping && <Text style={styles.typingIndicator}>typing...</Text>}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.messagesList}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={handleTyping}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#2196F3',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  typingIndicator: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
  },
  messagesList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2196F3',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});