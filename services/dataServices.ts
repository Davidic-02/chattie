import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { UserModel } from '../models/userModel';

export class FirebaseDataService {
  async getCurrentUser(): Promise<UserModel | null> {
    const currentUser = auth().currentUser;
    if (!currentUser) return null;

    const userDoc = await firestore()
      .collection('users')
      .doc(currentUser.uid)
      .get();

    if (!userDoc.exists) return null;

    const data = userDoc.data()!;
    return {
      uid: currentUser.uid,
      name: data.name,
      role: data.role,
      department: data.department,
      email: data.email,
      profileImageUrl: data.profileImageUrl,
      isOnline: data.isOnline || false,
      lastSeen: data.lastSeen?.toDate(),
    };
  }

  async getUsersByIds(userIds: string[]): Promise<{
    users: Record<string, UserModel>;
    notFound: Set<string>;
  }> {
    const users: Record<string, UserModel> = {};
    const notFound = new Set<string>();

    for (const userId of userIds) {
      try {
        const doc = await firestore().collection('users').doc(userId).get();
        if (doc.exists()) {
          const data = doc.data()!;
          users[userId] = {
            uid: userId,
            name: data.name,
            role: data.role,
            department: data.department,
            email: data.email,
            profileImageUrl: data.profileImageUrl,
            isOnline: data.isOnline || false,
          };
        } else {
          notFound.add(userId);
        }
      } catch (error) {
        notFound.add(userId);
      }
    }

    return { users, notFound };
  }

  async getUsersGroupedByDepartment(): Promise<Record<string, UserModel[]>> {
    const snapshot = await firestore().collection('users').get();
    const grouped: Record<string, UserModel[]> = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const user: UserModel = {
        uid: doc.id,
        name: data.name,
        role: data.role,
        department: data.department,
        email: data.email,
        profileImageUrl: data.profileImageUrl,
        isOnline: data.isOnline || false,
      };

      if (!grouped[user.department]) {
        grouped[user.department] = [];
      }
      grouped[user.department].push(user);
    });

    return grouped;
  }
}