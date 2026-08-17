import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import express from 'express';
import cors from 'cors';
import extractionRouter from './routes.js';

// Initialize Firebase Admin singleton
if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();

const app = express();

app.use(cors({ origin: true }));
// 50MB payload limit for base64 / documents
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/', extractionRouter);

// Export Cloud Function
export const extractionApi = onRequest(
  {
    cors: true,
    timeoutSeconds: 120,
    memory: '1GiB',
  },
  app
);
