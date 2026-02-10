// components/ui/ChatMessage.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type MessageBubbleProps = {
  message: string;
  isMe: boolean;
};

export default function ChatMessage({ message, isMe }: MessageBubbleProps) {
  return (
    <View style={[styles.bubble, isMe ? styles.me : styles.other]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
  },
  me: {
    backgroundColor: '#4f93ff',
    alignSelf: 'flex-end',
  },
  other: {
    backgroundColor: '#e5e5e5',
    alignSelf: 'flex-start',
  },
  text: {
    color: 'white',
  },
});
