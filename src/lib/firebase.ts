
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBRVXT3sWG7DITcXrsptRCVpOKMvZrh8GA",
  authDomain: "stitchsavvy-qqp2h.firebaseapp.com",
  projectId: "stitchsavvy-qqp2h",
  storageBucket: "stitchsavvy-qqp2h.firebasestorage.app",
  messagingSenderId: "346555942732",
  appId: "1:346555942732:web:cd0f25de847894a0feb1e9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
