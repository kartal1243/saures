import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyAU2Zx5J6Df1VSUEdbEvNSfpFxio1pULCQ",
  authDomain: "dukkanim-yanimda.firebaseapp.com",
  projectId: "dukkanim-yanimda",
  storageBucket: "dukkanim-yanimda.firebasestorage.app",
  messagingSenderId: "403857948982",
  appId: "1:403857948982:web:43381cfd3bd8ce39f17397",
  measurementId: "G-D0M0XT9PC5"
};

// Uygulama yeniden render edildiğinde çift initialize olmasını önle
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// SMS onay mesajlarının Türkçe gitmesi için varsayılan dili ayarla
auth.languageCode = 'tr';
