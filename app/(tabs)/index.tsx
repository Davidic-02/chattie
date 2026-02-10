import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Href, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { UserModel } from '../../models/userModel';
import { FirebaseDataService } from '../../services/dataServices';

interface RecentChat {
  id: string;
  otherUserId: string;
  otherUser?: UserModel;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const currentUser = auth().currentUser!;
  const dataService = new FirebaseDataService();

  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('recentChats')
      .orderBy('timestamp', 'desc')
      .onSnapshot(async snapshot => {
        const chats: RecentChat[] = [];
        const userIds: string[] = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          const isSender = data.senderId === currentUser.uid;
          const otherUserId = isSender ? data.receiverId : data.senderId;

          chats.push({
            id: doc.id,
            otherUserId,
            lastMessage: data.text || '',
            timestamp: data.timestamp?.toDate() || new Date(),
            unreadCount: data.unreadCount || 0,
          });

          userIds.push(otherUserId);
        });

        // Fetch user details
        if (userIds.length > 0) {
          const { users } = await dataService.getUsersByIds(userIds);
          
          chats.forEach(chat => {
            chat.otherUser = users[chat.otherUserId];
          });
        }

        setRecentChats(chats.filter(chat => chat.otherUser)); // Filter out deleted users
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  };

  const filteredChats = recentChats.filter(chat =>
    chat.otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = ({ item }: { item: RecentChat }) => {
    if (!item.otherUser) return null;

    return (
   <TouchableOpacity
  style={styles.chatItem}
  onPress={() => {
    const href: Href = {
      pathname: '/chat/[id]',
      params: { id: item.otherUserId }
    };
    router.push(href as any);
  }}
>

        <View style={styles.avatarContainer}>
          {item.otherUser.profileImageUrl ? (
            <Image
              source={{ uri: item.otherUser.profileImageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.otherUser.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {item.otherUser.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[
              styles.chatName,
              item.unreadCount > 0 && styles.unreadName
            ]}>
              {item.otherUser.name}
            </Text>
            <Text style={[
              styles.timestamp,
              item.unreadCount > 0 && styles.unreadTimestamp
            ]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
          
          <View style={styles.chatFooter}>
            <Text
              style={[
                styles.lastMessage,
                item.unreadCount > 0 && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Chat List */}
      {filteredChats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start chatting with your colleagues
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={item => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  searchContainer: {
    padding: 20,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  unreadName: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  unreadTimestamp: {
    color: '#2196F3',
    fontWeight: '600',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '500',
    color: '#333',
  },
  unreadBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});