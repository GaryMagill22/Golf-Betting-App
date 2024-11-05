require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


admin.initializeApp();
const db = admin.firestore();

const getUserData = functions.https.onCall(async (data, context) => {
  const userId = context.auth.uid;

  if (!userId) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  try {
    const userDocRef = db.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User document not found.");
    }

    const userData = userDoc.data();
    return {userData};
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new functions.https.HttpsError("internal", "Unable to fetch user data");
  }
});

exports.getUserData = getUserData;

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  const {amount} = data;

  try {
    console.log("Amount received:", amount);
    console.log("Context object in createPaymentIntent:", context.auth.uid);

    // sending empty object as first argument to getUserData function
    console.log("Context object BEFORE getUserData:", context);
    const userDataResult = await getUserData({}, context);
    console.log("Context object AFTER getUserData:", context);
    console.log("User data result:", userDataResult);
    const userData = userDataResult.data.userData;

    const stripeCustomerId = userData.stripeCustomerId;
    console.log("Stripe customer ID:", stripeCustomerId);

    console.log("Stripe restricted key:", process.env.STRIPE_RESTRICTED_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
      customer: stripeCustomerId,
      metadata: {firebaseUID: context.auth.uid},
      automatic_payment_methods: {enabled: true},
    });

    console.log("PaymentIntent created:", paymentIntent);
    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    if (error.code === "unauthenticated") {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "The function must be called while authenticated.",
          error.stack,
      );
    } else {
      throw new functions.https.HttpsError(
          "internal",
          "Unable to create payment intent: " + error.message,
      );
    }
  }
});

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


