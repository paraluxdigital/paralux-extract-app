import 'dotenv/config';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import express from 'express';
import cors from 'cors';
import extractionRouter from './routes.js';

// Initialize Firebase Admin singleton
if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'paralux-extract',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'paralux-extract.firebasestorage.app',
  });
}

export const db = getFirestore();

const app = express();

app.use(cors({ origin: true }));
// 50MB payload limit for base64 / documents
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/', extractionRouter);
app.use('/api', extractionRouter);
app.use('/paralux-extract/us-central1/extractionApi', extractionRouter);

export { app };

export const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Export HTTPS Cloud Function for Extraction API
export const extractionApi = onRequest(
  {
    cors: true,
    timeoutSeconds: 120,
    memory: '1GiB',
    secrets: [geminiApiKey],
  },
  app
);

// Export Event-Driven Background Trigger for Auto-Resuming Paused Queue Jobs
export { onCreditTopupResumeQueue } from './triggers/queueTrigger.js';
