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

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  const userId = data.userId;
  const amount = data.amount;

  console.log("User ID:", userId);
  console.log("Amount:", amount);

  try {
    // Retrieve the user record from Firebase Auth
    const userRecord = await admin.auth().getUser(userId);
    console.log("User Record:", userRecord);

    // Assuming you've stored the Stripe customer ID in Firebase Auth custom claims
    const stripeCustomerId = userRecord.customClaims.stripeCustomerId;
    console.log("Stripe Customer ID:", stripeCustomerId);

    if (!stripeCustomerId) {
      throw new functions.https.HttpsError(
          "failed-precondition",
          "The user does not have a Stripe customer ID.",
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      customer: stripeCustomerId,
      metadata: {userId},
    });

    console.log("PaymentIntent created:", paymentIntent);
    return {
      paymentIntent: {
        clientSecret: paymentIntent.client_secret,
      },
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new functions.https.HttpsError("internal", "Unable to create payment intent");
  }
});

// THIS FUNCTION IS ALREADY DEPLOYED BUT NOT USED
exports.createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
  const {amount} = data;
  const userId = context.auth.uid;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "Wallet Deposit",
        },
        unit_amount: amount,
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: "https://yourapp.com/success",
    cancel_url: "https://yourapp.com/cancel",
    client_reference_id: userId,
  });

  return {sessionId: session.id};
});
