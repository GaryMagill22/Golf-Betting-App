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
  const {amount} = data;
  const userId = context.auth.uid;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    customer: userId,
    metadata: {userId},
  });

  return {
    paymentIntent: {
      clientSecret: paymentIntent.client_secret,
    },
  };
});

// THIS FUNCTION IS ALREADY DEPLOYED BUT NOT USED
// exports.createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
//   const {amount} = data;
//   const userId = context.auth.uid;

//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ["card"],
//     line_items: [{
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: "Wallet Deposit",
//         },
//         unit_amount: amount,
//       },
//       quantity: 1,
//     }],
//     mode: "payment",
//     success_url: "https://yourapp.com/success",
//     cancel_url: "https://yourapp.com/cancel",
//     client_reference_id: userId,
//   });

//   return {sessionId: session.id};
// });
