import {onRequest} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({region: "us-east1"});

// JotForm webhook handler
export const jotformWebhook = onRequest(
  {
    cors: true,
    invoker: 'public'
  },
  async (request, response) => {
  // Enable CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(200).end();
    return;
  }
  try {
    logger.info("JotForm webhook received", {data: request.body});

    // Extract form data from JotForm
    const formData = request.body;
    const rawRequest = formData.rawRequest || formData;

    // Extract key fields (JotForm uses q1_email, q2_name format)
    const clientEmail = rawRequest.q3_email || rawRequest.q1_email ||
        rawRequest.email;
    const clientName = rawRequest.q2_name || rawRequest.q1_name ||
        rawRequest.name;

    logger.info("Extracted data", {clientEmail, clientName});

    if (!clientEmail) {
      logger.error("No email found in webhook data");
      response.status(400).json({error: "No email found in form data"});
      return;
    }

    // Determine form type
    const formType = determineFormType(rawRequest);

    // Create form submission record in Firestore
    const submissionData = {
      email: clientEmail,
      name: clientName,
      formData: rawRequest,
      formType: formType,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      processed: false,
    };

    // Write to Firestore
    const docRef = await db.collection("form_submissions")
      .add(submissionData);

    logger.info("Form submission saved", {submissionId: docRef.id});

    response.json({
      success: true,
      message: "Form submission processed successfully",
      submissionId: docRef.id,
    });
  } catch (error) {
    logger.error("Webhook processing failed", {error});
    response.status(500).json({error: "Internal server error"});
  }
});

/**
 * Determine if this is a buyer or seller form based on form fields
 * @param {any} formData - The form data from JotForm
 * @return {"buyer" | "seller"} The determined form type
 */
function determineFormType(formData: any): "buyer" | "seller" {
  const fields = Object.keys(formData).join(" ").toLowerCase();

  if (fields.includes("budget") || fields.includes("buying") ||
      fields.includes("purchase")) {
    return "buyer";
  } else if (fields.includes("selling") || fields.includes("listing") ||
             fields.includes("property")) {
    return "seller";
  }

  // Default to buyer
  return "buyer";
}

// Health check function
export const healthCheck = onRequest((request, response) => {
  response.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "JotForm webhook endpoint is running",
  });
});
