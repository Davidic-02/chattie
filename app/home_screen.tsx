import { addDoc, collection, getDocs } from 'firebase/firestore';
import { useEffect } from 'react';
import { db } from '../services/firebaseConfig';

useEffect(() => {
  const testFirebase = async () => {
    const colRef = collection(db, 'test'); // "test" collection
    await addDoc(colRef, { message: 'Hello Firebase!' }); // add a doc
    const snapshot = await getDocs(colRef);
    snapshot.forEach(doc => {
      console.log(doc.id, doc.data());
    });
  };

  testFirebase();
}, []);
