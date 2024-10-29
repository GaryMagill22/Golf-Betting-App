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


// exports.createStripeCustomer = functions.https.onCall(async (data, context) => {
//   try {
//     const {email, firebaseUID} = data;

//     const customer = await stripe.customers.create({
//       email: email,
//       metadata: {
//         firebaseUID: firebaseUID,
//       },
//     });

//     await db.collection("users").doc(firebaseUID).update({
//       stripeCustomerId: customer.id,
//     });

//     return {customerId: customer.id};
//   } catch (error) {
//     console.error("Error creating Stripe customer:", error);
//     throw new functions.https.HttpsError("internal", "Failed to create customer");
//   }
// });


// fails to create customer because doc() expects the first argument to be a CollectionReference, not just the string name of the collection.
// exports.createStripeCustomer = functions.https.onCall(async (data, context) => {
//   try {
//     // Create a Stripe customer object
//     const customer = await stripe.customers.create({
//       email: data.email,
//       metadata: {
//         firebaseUID: data.firebaseUID, // Include Firebase UID for easy lookup
//       },
//     });
//     // Store the Stripe customer ID in Firestore
//     await updateDoc(doc(db, "users", data.firebaseUID), {
//       stripeCustomerId: customer.id,
//     });
//     // Return the Stripe customer ID (optional)
//     return {customerId: customer.id};
//   } catch (error) {
//     console.error("Error creating Stripe customer:", error);
//     // Throw an HttpsError for better error handling in your client app
//     throw new functions.https.HttpsError("internal", "Failed to create customer");
//   }
// });

