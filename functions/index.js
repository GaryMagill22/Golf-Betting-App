require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


admin.initializeApp();

exports.createStripeCustomer = functions.https.onCall(async (data, context) => {
  try {
    const {email, firebaseUID} = data;

    const customer = await stripe.customers.create({
      email,
      metadata: {firebaseUID},
    });

    return {customerId: customer.id};
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw new functions.https.HttpsError("internal", "Failed to create customer");
  }
});
