require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {doc, updateDoc} = require("firebase/firestore");

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
    const userDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
    const stripeCustomerId = userDoc.data().stripeCustomerId;

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: stripeCustomerId,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Deposit Funds",
          },
          unit_amount: data.amount,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: "exp://localhost:8080/payment-success",
      cancel_url: "exp://localhost:8080/payment-canceled",
    });

    return {sessionId: session.id};
  } catch (error) {
    console.error("Error creating Checkout Session:", error);
    throw new functions.https.HttpsError("internal", "Failed to create Checkout Session");
  }
});

exports.checkoutSessionCompleted = functions.https.onRequest(async (req, res) => {
  const endpointSecret = functions.config().stripe.webhook_secret;
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      await updateUserWalletBalance(session);
      return res.json({received: true});
    } catch (error) {
      console.error("Error updating user wallet balance:", error);
      return res.status(500).send("Error updating user wallet balance");
    }
  } else {
    return res.json({received: true});
  }
});


/**
 * Updates the user's wallet balance after a successful payment
 * @param {Object} session - The Stripe Checkout Session object
 * @returns {Promise<void>} A Promise that resolves when the wallet balance is updated
 */
async function updateUserWalletBalance(session) {
  const customerId = session.customer;
  const amount = session.amount_total;

  const userSnapshot = await admin.firestore().collection("users")
      .where("stripeCustomerId", "==", customerId).get();

  if (userSnapshot.empty) {
    console.error("No matching user found for Stripe customer ID:", customerId);
    return;
  }

  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data();

  const currentBalance = userData.walletBalance || 0;
  const newBalance = currentBalance + amount;

  await userDoc.ref.update({walletBalance: newBalance});

  console.log(`Updated wallet balance for user ${userDoc.id}: ${newBalance}`);
}
