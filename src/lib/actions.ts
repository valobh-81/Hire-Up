
"use server";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as nodemailer from "nodemailer";
import { z } from "zod";

export type EmailStatus = {
  email: string;
  status: "success" | "failed";
  message: string;
};

async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; message: string }> {
  const { GMAIL_EMAIL, GMAIL_APP_PASSWORD } = process.env;

  if (!GMAIL_EMAIL || !GMAIL_APP_PASSWORD) {
    const errorMessage = "Email service is not configured. Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables.";
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_EMAIL,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Hire Up" <${GMAIL_EMAIL}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`Successfully sent email to ${to} with title "${subject}"`);
    return { success: true, message: "Email sent successfully." };
  } catch (error: any) {
    console.error(`Failed to send email to ${to}:`, error);
    return {
      success: false,
      message: `Failed to send email: ${error.message || "Unknown error"}`,
    };
  }
}

export async function getStudentEmailCount(): Promise<number> {
    try {
        const querySnapshot = await getDocs(collection(db, "student-emails"));
        return querySnapshot.size;
    } catch (error) {
        console.error("Error fetching student emails:", error);
        return 0;
    }
}


export async function sendBulkNotification(subject: string, content: string): Promise<EmailStatus[]> {

  let recipients: string[] = [];
  try {
    const querySnapshot = await getDocs(collection(db, "student-emails"));
    recipients = querySnapshot.docs.map(doc => doc.data().email);
  } catch (error) {
    console.error("Error fetching recipients:", error);
    throw new Error("Could not fetch recipients. Please check your Firestore security rules.");
  }
  
  if(recipients.length === 0) {
    return [];
  }

  const uniqueEmails = [...new Set(recipients)];
  const htmlContent = `<p>${content.replace(/\n/g, "<br>")}</p>`;


  const results = await Promise.all(
    uniqueEmails.map(async (email) => {
      const result = await sendEmail(email, subject, htmlContent);
      return {
        email,
        status: result.success ? "success" : "failed",
        message: result.message,
      };
    })
  );

  return results;
}
