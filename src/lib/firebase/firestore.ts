import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QueryConstraint,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './client';

// Get a document by ID
export async function getDocument(collectionName: string, documentId: string) {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { data: null, error: new Error('Document not found') };
    }
  } catch (error) {
    console.error('Error getting document:', error);
    return { data: null, error: error as Error };
  }
}

// Query documents with filters
export async function queryDocuments(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { data: documents, error: null };
  } catch (error) {
    console.error('Error querying documents:', error);
    return { data: null, error: error as Error };
  }
}

// Add a document
export async function addDocument(collectionName: string, data: DocumentData) {
  try {
    const collectionRef = collection(db, collectionName);
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Error adding document:', error);
    return { id: null, error: error as Error };
  }
}

// Update a document
export async function updateDocument(
  collectionName: string,
  documentId: string,
  data: DocumentData
) {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    return { error: null };
  } catch (error) {
    console.error('Error updating document:', error);
    return { error: error as Error };
  }
}

// Delete a document
export async function deleteDocument(collectionName: string, documentId: string) {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);

    return { error: null };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { error: error as Error };
  }
}

// Export query builders for convenience
export { collection, doc, query, where, orderBy, limit, serverTimestamp };
