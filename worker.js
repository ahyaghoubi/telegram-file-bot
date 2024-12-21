/**
 * Telegram File Handling Bot for Cloudflare Workers
 * This bot dynamically determines the file type and uploads it as a photo, video, audio, or document to Telegram.
 * 
 * Set the following environment variables when deploying:
 * 1. ENV_BOT_TOKEN - Your Telegram bot token (get it from @BotFather)
 * 2. ENV_BOT_SECRET - Your webhook secret token for validation
 */

const TOKEN = ENV_BOT_TOKEN; // Set your Telegram bot token as an environment variable
const WEBHOOK = '/endpoint'; // The main webhook endpoint
const SECRET = ENV_BOT_SECRET; // Set your webhook secret token as an environment variable

/**
 * Wait for requests to the worker
 */
addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname === WEBHOOK) {
    event.respondWith(handleWebhook(event));
  } else if (url.pathname === '/setwebhook') {
    event.respondWith(setWebhook(event, url, WEBHOOK, SECRET));
  } else if (url.pathname === '/unregisterwebhook') {
    event.respondWith(unregisterWebhook(event));
  } else {
    event.respondWith(new Response('No handler for this request'));
  }
});

/**
 * Handle webhook requests from Telegram
 */
async function handleWebhook(event) {
  // Check secret
  if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRET) {
    return new Response('Unauthorized', { status: 403 });
  }

  // Read and process the incoming Telegram update
  const update = await event.request.json();
  event.waitUntil(onUpdate(update)); // Handle asynchronously

  return new Response('Ok');
}

/**
 * Handle Telegram updates
 */
async function onUpdate(update) {
  if ('message' in update) {
    await onMessage(update.message);
  }
}

/**
 * Handle incoming Telegram messages
 */
async function onMessage(message) {
  const chatId = message.chat.id;
  const text = message.text;

  if (!isValidUrl(text)) {
    await sendPlainText(chatId, 'Please send a valid URL to download the file.');
    return;
  }

  try {
    // Step 1: Fetch the file and its metadata
    const fileResponse = await fetch(text);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`);
    }

    const contentLength = parseInt(fileResponse.headers.get('content-length'), 10);
    const contentType = fileResponse.headers.get('content-type');
    const fileName = text.split('/').pop() || 'file';

    // Check file size limit
    if (contentLength > 50 * 1024 * 1024) {
      await sendPlainText(chatId, "The file is too large to send (maximum: 50 MB).");
      return;
    }

    // Convert the file to a Blob
    const fileBlob = await fileResponse.blob();

    // Determine the appropriate upload type based on MIME type or file extension
    const lowerCaseFileName = fileName.toLowerCase();
    if (contentType.startsWith('image/') || isImageExtension(lowerCaseFileName)) {
      await sendPhoto(chatId, fileBlob, fileName);
    } else if (contentType.startsWith('video/') || isVideoExtension(lowerCaseFileName)) {
      await sendVideo(chatId, fileBlob, fileName);
    } else if (contentType.startsWith('audio/') || isAudioExtension(lowerCaseFileName)) {
      await sendAudio(chatId, fileBlob, fileName);
    } else {
      await sendDocument(chatId, fileBlob, fileName);
    }
  } catch (error) {
    await sendPlainText(chatId, `Error: ${error.message}`);
  }
}

/**
 * Upload a photo
 */
async function sendPhoto(chatId, fileBlob, fileName) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('photo', new File([fileBlob], fileName));

  const response = await fetch(apiUrl('sendPhoto'), {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!result.ok) {
    throw new Error(`Failed to send photo: ${result.description}`);
  }
}

/**
 * Upload a video
 */
async function sendVideo(chatId, fileBlob, fileName) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('video', new File([fileBlob], fileName));

  const response = await fetch(apiUrl('sendVideo'), {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!result.ok) {
    throw new Error(`Failed to send video: ${result.description}`);
  }
}

/**
 * Upload an audio file
 */
async function sendAudio(chatId, fileBlob, fileName) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('audio', new File([fileBlob], fileName));

  const response = await fetch(apiUrl('sendAudio'), {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!result.ok) {
    throw new Error(`Failed to send audio: ${result.description}`);
  }
}

/**
 * Upload a generic file
 */
async function sendDocument(chatId, fileBlob, fileName) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('document', new File([fileBlob], fileName));

  const response = await fetch(apiUrl('sendDocument'), {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!result.ok) {
    throw new Error(`Failed to send document: ${result.description}`);
  }
}

/**
 * Register the webhook with Telegram
 */
async function setWebhook(event, requestUrl, suffix, secret) {
  const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`;
  const response = await fetch(apiUrl('setWebhook', {
    url: webhookUrl,
    secret_token: secret,
  }));

  const result = await response.json();
  if (result.ok) {
    return new Response('Webhook registered successfully!');
  } else {
    return new Response(`Failed to register webhook: ${JSON.stringify(result, null, 2)}`, { status: 500 });
  }
}

/**
 * Unregister the webhook with Telegram
 */
async function unregisterWebhook(event) {
  const response = await fetch(apiUrl('setWebhook', { url: '' }));
  const result = await response.json();
  if (result.ok) {
    return new Response('Webhook unregistered successfully!');
  } else {
    return new Response(`Failed to unregister webhook: ${JSON.stringify(result, null, 2)}`, { status: 500 });
  }
}

/**
 * Send plain text message
 */
async function sendPlainText(chatId, text) {
  return (await fetch(apiUrl('sendMessage', { chat_id: chatId, text }))).json();
}

/**
 * Validate if the provided string is a valid URL
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Check if the file extension is a supported image format
 */
function isImageExtension(fileName) {
  return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
}

/**
 * Check if the file extension is a supported video format
 */
function isVideoExtension(fileName) {
  return /\.(mp4|avi|mov|mkv|wmv|flv|webm)$/i.test(fileName);
}

/**
 * Check if the file extension is a supported audio format
 */
function isAudioExtension(fileName) {
  return /\.(mp3|wav|aac|flac|ogg|m4a)$/i.test(fileName);
}

/**
 * Generate API URL for Telegram requests
 */
function apiUrl(methodName, params = null) {
  let query = '';
  if (params) {
    query = '?' + new URLSearchParams(params).toString();
  }
  return `https://api.telegram.org/bot${TOKEN}/${methodName}${query}`;
}
