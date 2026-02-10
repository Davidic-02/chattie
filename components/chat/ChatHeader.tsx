// components/chat/ChatHeader.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ChatHeaderProps = {
  title: string;
};

export default function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 12,
    backgroundColor: '#4f93ff',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
