const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// Sends a push to every other participant of a chat (1:1 or group — a group
// chat is just a chat doc with more than two participants, same
// subcollection) whenever a new message is written.
exports.onNewChatMessage = onDocumentCreated('chats/{chatId}/messages/{messageId}', async (event) => {
  const message = event.data?.data();
  if (!message) return;

  const { chatId } = event.params;
  const senderId = message.senderId;
  const senderName = message.senderName || 'Someone';
  const text = typeof message.text === 'string' ? message.text : '';

  const chatSnap = await db.doc(`chats/${chatId}`).get();
  if (!chatSnap.exists) return;
  const chat = chatSnap.data();
  const participants = Array.isArray(chat.participants) ? chat.participants : [];
  const recipients = participants.filter((uid) => uid && uid !== senderId);
  if (recipients.length === 0) return;

  const userSnaps = await db.getAll(...recipients.map((uid) => db.doc(`users/${uid}`)));
  const tokens = userSnaps
    .map((snap) => snap.exists ? snap.data().fcmToken : null)
    .filter((token) => typeof token === 'string' && token.length > 0);
  if (tokens.length === 0) return;

  const title = chat.activityTitle ? `${senderName} • ${chat.activityTitle}` : senderName;

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body: text.slice(0, 200) },
    data: { type: 'chat_message', chatId },
    apns: { payload: { aps: { sound: 'default' } } },
    android: { priority: 'high' },
  });

  // Clean up tokens Apple/Google have confirmed are no longer valid, so
  // future sends don't keep paying the lookup cost for dead devices.
  const staleTokens = [];
  response.responses.forEach((r, i) => {
    if (!r.success && (
      r.error?.code === 'messaging/registration-token-not-registered'
      || r.error?.code === 'messaging/invalid-registration-token'
    )) {
      staleTokens.push(tokens[i]);
    }
  });
  if (staleTokens.length > 0) {
    const staleUids = userSnaps
      .filter((snap) => snap.exists && staleTokens.includes(snap.data().fcmToken))
      .map((snap) => snap.id);
    await Promise.all(staleUids.map((uid) =>
      db.doc(`users/${uid}`).update({ fcmToken: null }).catch(() => {})
    ));
  }

  logger.info(`Chat ${chatId}: sent ${response.successCount}/${tokens.length} notifications`);
});
