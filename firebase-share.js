
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getDatabase,
  get,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  set
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzSgekD5e1jRmi5Iq3HXtjSGGKa1zQQko",
  authDomain: "checklistapp-12dfd.firebaseapp.com",
  projectId: "checklistapp-12dfd",
  storageBucket: "checklistapp-12dfd.firebasestorage.app",
  databaseURL: "https://checklistapp-12dfd-default-rtdb.europe-west1.firebasedatabase.app/",
  messagingSenderId: "82227278115",
  appId: "1:82227278115:web:ca57f2c9de2360b737dc96",
  measurementId: "G-GC7KSEQW4E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Sign in this browser anonymously.
const authReady = signInAnonymously(auth);

const sharedListRef = shareId => ref(db, `sharedLists/${shareId}`);

const serializeSharedList = list => ({
  title: list.title,
  icon: list.icon,
  tasks: list.tasks,
  notes: list.notes
});

const mergeSharedList = (remote, base, local) => {
  if (!remote) return null;
  if (!base) return remote;
  const merged = {...remote};
  ["title", "icon", "notes"].forEach(field => {
    if (local[field] !== base[field]) merged[field] = local[field];
  });

  const toTaskMap = tasks => new Map(
    (Array.isArray(tasks) ? tasks : Object.values(tasks || {}))
      .filter(task => task && typeof task.id === "string")
      .map(task => [task.id, task])
  );
  const baseTasks = toTaskMap(base.tasks);
  const localTasks = toTaskMap(local.tasks);
  const mergedTasks = toTaskMap(remote.tasks);

  baseTasks.forEach((baseTask, id) => {
    const localTask = localTasks.get(id);
    if (!localTask) {
      mergedTasks.delete(id);
      return;
    }
    const changedFields = ["text", "done"].filter(field => localTask[field] !== baseTask[field]);
    const remoteTask = mergedTasks.get(id);
    if (!remoteTask) {
      if (changedFields.length) mergedTasks.set(id, localTask);
      return;
    }
    const mergedTask = {...remoteTask};
    changedFields.forEach(field => { mergedTask[field] = localTask[field]; });
    mergedTasks.set(id, mergedTask);
  });
  localTasks.forEach((task, id) => {
    if (!baseTasks.has(id) && !mergedTasks.has(id)) mergedTasks.set(id, task);
  });

  merged.tasks = [...mergedTasks.values()];
  return merged;
};

const createSharedList = async list => {
  await authReady;
  const newListRef = push(ref(db, "sharedLists"));
  await set(newListRef, serializeSharedList(list));
  return newListRef.key;
};

const readSharedList = async shareId => {
  await authReady;
  const snapshot = await get(sharedListRef(shareId));
  return snapshot.exists() ? snapshot.val() : null;
};

const updateSharedList = async (shareId, list, base) => {
  await authReady;
  const result = await runTransaction(sharedListRef(shareId), remote =>
    remote ? mergeSharedList(remote, base, serializeSharedList(list)) : undefined
  );
  if (!result.committed) throw new Error("Firebase cancelled the shared checklist update.");
  return result.snapshot.val();
};

const subscribeSharedList = (shareId, onChange, onError) =>
  onValue(sharedListRef(shareId), snapshot => {
    onChange(snapshot.exists() ? snapshot.val() : null);
  }, onError);

const deleteSharedList = async shareId => {
  await authReady;
  await remove(sharedListRef(shareId));
};

const testFirebaseConnection = async () => {
  await authReady;
  await new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error("Timed out waiting for the Firebase Realtime Database connection."));
    }, 10000);
    unsubscribe = onValue(ref(db, ".info/connected"), snapshot => {
      if (snapshot.val() !== true) return;
      clearTimeout(timeout);
      unsubscribe();
      resolve();
    }, error => {
      clearTimeout(timeout);
      unsubscribe();
      reject(error);
    });
  });
};

export {
  app,
  auth,
  db,
  authReady,
  createSharedList,
  readSharedList,
  serializeSharedList,
  mergeSharedList,
  updateSharedList,
  subscribeSharedList,
  deleteSharedList,
  testFirebaseConnection
};
