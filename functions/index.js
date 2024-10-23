require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {doc, updateDoc, getDoc} = require("firebase/firestore");

admin.initializeApp();
const db = admin.firestore();


exports.createCustomer = functions.https.onCall(async (data, context) => {
  try {
    // Create a Stripe customer object
    const customer = await stripe.customers.create({
      email: data.email,
      metadata: {
        firebaseUID: data.firebaseUID, // Include Firebase UID for easy lookup
      },
    });
    // Store the Stripe customer ID in Firestore
    await updateDoc(doc(db, "users", data.firebaseUID), {
      stripeCustomerId: customer.id,
      walletBalance: 0,
    });
    // Return the Stripe customer ID (optional)
    return {customerId: customer.id};
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    // Throw an HttpsError for better error handling in your client app
    throw new functions.https.HttpsError("internal", "Failed to create customer");
  }
});

exports.fundWallet = functions.https.onCall(async (data, context) => {
  try {
    const userDoc = await getDoc(doc(db, "users", context.auth.uid));
    const stripeCustomerId = userDoc.data().stripeCustomerId;
    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount, // Amount to add to the wallet (in cents)
      currency: "usd",
      customer: stripeCustomerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {clientSecret: paymentIntent.client_secret};
  } catch (error) {
    console.error("Error creating Payment Intent:", error);
    throw new functions.https.HttpsError("internal", "Failed to fund wallet");
  }
});

exports.handlePaymentIntentSucceeded = functions.https.onRequest(async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    try {
      await updateUserWalletBalance(paymentIntent);
      res.json({received: true});
    } catch (error) {
      console.error("Error updating user wallet balance:", error);
      res.status(500).send("Error updating user wallet balance");
    }
  } else {
    res.json({received: true});
  }
});
/**
 * Updates the user's wallet balance after a successful payment
 * @param {Object} paymentIntent - The Stripe PaymentIntent object
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<number>} The updated wallet balance
 */
async function updateUserWalletBalance(paymentIntent) {
  const customerId = paymentIntent.customer;
  const amount = paymentIntent.amount;

  // Query Firestore to get the user document with the matching Stripe customer ID
  const userSnapshot = await admin.firestore().collection("users")
      .where("stripeCustomerId", "==", customerId).get();
  if (userSnapshot.empty) {
    console.error("No matching user found for Stripe customer ID:", customerId);
    return;
  }

  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data();

  // Calculate new balance
  const currentBalance = userData.walletBalance || 0;
  const newBalance = currentBalance + amount;

  // Update the user's wallet balance in Firestore
  await userDoc.ref.update({walletBalance: newBalance});

  console.log(`Updated wallet balance for user ${userDoc.id}: ${newBalance}`);
}
