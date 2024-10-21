require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();
const db = admin.firestore();

exports.createCustomer = functions.https.onCall(async (data, context) => {
  try {
    // Get the user's email and Firebase UID from the data object
    const {email, firebaseUID} = data;
    console.log("Received firebaseUID:", firebaseUID); // Add this line to log the received UID


    // Create a Stripe customer object
    const customer = await stripe.customers.create({
      email: email,
      metadata: {
        firebaseUID: firebaseUID, // Include Firebase UID for easy lookup
      },
    });

    // Store the Stripe customer ID in Firestore
    await db.collection("users").doc(firebaseUID).update({
      stripeCustomerId: customer.id,
    });

    // Return the Stripe customer ID (optional)
    return {customerId: customer.id};
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    // Throw an HttpsError for better error handling in your client app
    throw new functions.https.HttpsError("internal", "Failed to create customer");
  }
});
