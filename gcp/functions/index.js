/**
 * @see https://firebase.google.com/products/extensions/firestore-send-email
 * @see https://firebase.google.com/docs/functions/auth-events
 * @see https://firebase.google.com/docs/functions/schedule-functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
  const displayName = user.displayName ||
                      user.email.split("@")[0].replace(/[.-]+/g, " ");
  const email = `${displayName} <${user.email}>`;
  admin
      .firestore()
      .collection("mail")
      .add({
        to: email,
        template: {
          name: "welcome-message",
          data: {displayName},
        },
      })
      .then(() => functions.logger.info("New user created:", displayName))
      .catch((ex) => functions.logger.error("Failed to send email:", ex));
});

// Clean up the database by deleting messages sent more than 30 days ago.
exports.scheduledDatabaseCleaner = functions.pubsub
    .schedule("0 0 * * *") // every 24 hours at 12:00 AM
    .onRun(() => {
      const today = new Date();
      const past = today.setDate(today.getDate() - 30);
      admin
          .firestore()
          .collection("mail")
          .where("delivery.startTime", "<", past)
          .get()
          .then((records) => records.forEach((record) => record.ref.delete()))
          .catch((ex) => functions.logger.error("Failed to cleanup:", ex));
    });
