# 📖 FlipiAlbum - Deployment Guide

This guide will help you deploy your Digital Flipbook Album generator to **Vercel** with **Cloudinary** (for free image storage) and **Neon** (for your free database).

---

## 🚀 Step 1: Image Storage (Cloudinary)
Vercel's disk is temporary, so photos must be stored in the cloud.
1. Sign up for a free account at [Cloudinary.com](https://cloudinary.com/).
2. On your Cloudinary Dashboard, copy the following:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

## 🗄️ Step 2: Database (Neon.tech)
1. Sign up for a free account at [Neon.tech](https://neon.tech/).
2. Create a new project named `flipbook`.
3. Copy your **Connection String** (it starts with `postgres://...`).

---

## ⚡ Step 3: Deployment (Vercel)
1. Push your code to a **GitHub** repository.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository.
4. **IMPORTANT**: Click on **"Environment Variables"** and add these 4 keys:

| Name | Value |
| :--- | :--- |
| `DATABASE_URL` | *Your Neon Connection String* |
| `CLOUDINARY_CLOUD_NAME` | *Your Cloudinary Cloud Name* |
| `CLOUDINARY_API_KEY` | *Your Cloudinary API Key* |
| `CLOUDINARY_API_SECRET` | *Your Cloudinary API Secret* |

5. Click **Deploy**.

---

## 🛠️ Local Development
If you want to run this on your own computer again with Cloud storage:
1. Create a `.env` file in the root folder.
2. Paste the same keys from above into that file.
3. Run `npm run dev`.

---

## 👑 Features for Customers
- **Privacy**: Customers only see the album (no admin buttons).
- **Music**: Plays automatically on the front cover.
- **Speed**: Images are optimized via Cloudinary for fast loading on mobile.
