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
    });
    console.log("Stripe customer created successfully:", customer.id);
    // Return the Stripe customer ID (optional)
    return {customerId: customer.id};
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    // Throw an HttpsError for better error handling in your client app
    throw new functions.https.HttpsError("internal", "Failed to create customer");
  }
});
