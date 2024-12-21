# **Telegram File Handling Bot**

A Cloudflare Worker-based Telegram bot that dynamically determines the type of files from user-provided URLs and uploads them to Telegram. This bot supports photos, videos, audio files, and documents, ensuring each file is uploaded in its correct format.

## **Features**
- 📷 **Photo Uploads**: Automatically identifies image formats (e.g., JPG, PNG, GIF) and uploads them as photos.
- 🎥 **Video Uploads**: Handles video formats (e.g., MP4, AVI, WEBM) and uploads them as native videos.
- 🎵 **Audio Uploads**: Recognizes audio formats (e.g., MP3, WAV) and uploads them as music/audio.
- 📄 **Document Uploads**: All other files are uploaded as generic documents.
- 🚦 **File Size Limit**: Ensures files are within Telegram's 50 MB limit.
- 🔒 **Secure Webhook**: Includes a secret token for validating incoming webhook requests.

---

## **Setup and Deployment**

### **1. Get Your Telegram Bot Token**
1. Visit [@BotFather](https://t.me/BotFather) on Telegram.
2. Create a new bot using the `/newbot` command.
3. Copy the provided bot token (e.g., `123456789:ABCDefghIJKLmnopQRSTuvWXyZ1234567`).

---

### **2. Clone This Repository**
```bash
git clone https://github.com/your-username/telegram-file-bot.git
cd telegram-file-bot
```

---

### **3. Set Environment Variables**
You need to configure the following environment variables:

| Variable         | Description                          |
|-------------------|--------------------------------------|
| `ENV_BOT_TOKEN`   | Your Telegram bot token.            |
| `ENV_BOT_SECRET`  | A unique secret token for security. |

#### **For Cloudflare Workers**
Set these variables via the Cloudflare dashboard or CLI:

**Using Dashboard:**
1. Go to the **Workers** page in the Cloudflare dashboard.
2. Click on your worker and go to **Settings > Variables**.
3. Add `ENV_BOT_TOKEN` and `ENV_BOT_SECRET`.

**Using Wrangler CLI:**
```bash
wrangler secret put ENV_BOT_TOKEN
wrangler secret put ENV_BOT_SECRET
```

---

### **4. Deploy to Cloudflare Workers**
1. Install the Wrangler CLI if not already installed:
   ```bash
   npm install -g wrangler
   ```
2. Publish the worker:
   ```bash
   wrangler publish
   ```

---

### **5. Register the Webhook**
After deploying the worker, set the webhook for your Telegram bot:

1. Replace `<YOUR_WORKER_URL>` with your Cloudflare Worker URL (e.g., `https://your-bot-name.workers.dev`).
2. Run this command:
   ```bash
   curl -F "url=<YOUR_WORKER_URL>/endpoint" \
        -F "secret_token=your-secret-token" \
        https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
   ```

---

## **Supported File Formats**

### **Images**
- JPG, JPEG, PNG, GIF, BMP, WEBP, SVG

### **Videos**
- MP4, AVI, MOV, MKV, WMV, FLV, WEBM

### **Audio**
- MP3, WAV, AAC, FLAC, OGG, M4A

### **Documents**
- All other files will be uploaded as generic documents.

---

## **How It Works**
1. Users send a URL to the bot on Telegram.
2. The bot:
   - Downloads the file from the provided URL.
   - Determines its type using the MIME type and file extension.
   - Uploads it in the correct format using the Telegram Bot API.

---

## **Error Handling**
- If the file size exceeds 50 MB, the bot responds with:  
  `The file is too large to send (maximum: 50 MB).`
- If the URL is invalid or the download fails, the bot responds with:  
  `Please send a valid URL to download the file.`
- If Telegram API encounters an issue, the bot provides an error message.

---

## **Future Enhancements**
- ✅ Support for ZIP or RAR archives with automatic extraction.
- ✅ Support for text and markdown messages for additional context.
- ✅ Progress indicators for large file downloads.

---

## **Contributing**
We welcome contributions to improve the bot. Here's how you can contribute:
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature-name"
   ```
4. Push to your branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

---

## **License**
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.