
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "stitchsavvy-qqp2h",
  "appId": "1:346555942732:web:cd0f25de847894a0feb1e9",
  "storageBucket": "stitchsavvy-qqp2h.firebasestorage.app",
  "apiKey": "AIzaSyBRVXT3sWG7DITcXrsptRCVpOKMvZrh8GA",
  "authDomain": "stitchsavvy-qqp2h.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "346555942732"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
