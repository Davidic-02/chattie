import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

type Staff = {
  id: string;
  name: string;
  avatar: string;
  role: string;
};

export default function HomeScreen() {
  const [staff, setStaff] = useState<Staff[]>([]);

  // Fetch fake staff data
  useEffect(() => {
    fetch('https://randomuser.me/api/?results=10')
      .then(res => res.json())
      .then(data => {
        const formatted = data.results.map((user: any, index: number) => ({
          id: String(index),
          name: `${user.name.first} ${user.name.last}`,
          avatar: user.picture.medium,
          role: ['Developer', 'Designer', 'Manager'][index % 3],
        }));
        setStaff(formatted);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Directory</Text>
      <FlatList
        data={staff}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.role}>{item.role}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  role: {
    fontSize: 14,
    color: '#666',
  },
});
