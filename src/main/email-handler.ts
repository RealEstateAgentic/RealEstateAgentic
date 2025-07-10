// Main process email handler using nodemailer
// This runs in the Node.js environment where nodemailer works properly

import nodemailer from 'nodemailer';
import { ipcMain } from 'electron';
import { config } from 'dotenv';

// Load environment variables
config();

// Create transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'damonbodine@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'snxjhlkkxsqvcfds'
  }
});

console.log('📧 Gmail config loaded:', {
  user: 'damonbodine@gmail.com',
  passwordLength: (process.env.GMAIL_APP_PASSWORD || '').length,
  hasPassword: !!(process.env.GMAIL_APP_PASSWORD)
});

// Email templates
const templates = {
  buyer_form_request: {
    subject: 'Complete Your Buyer Information Form',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi {{buyerName}},</h2>
        <p>Thank you for speaking with us about your home buying goals. To better serve you, please complete the buyer information form below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{formUrl}}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Your Form</a>
        </div>
        
        <p>This form will help us understand your needs, timeline, and preferences so we can provide you with the most relevant properties and guidance.</p>
        
        <p>Best regards,<br>{{agentName}}</p>
      </div>
    `
  },
  seller_form_request: {
    subject: 'Complete Your Seller Information Form',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi {{sellerName}},</h2>
        <p>Thank you for considering us to help sell your property. To provide you with an accurate market analysis and selling strategy, please complete the seller information form:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{formUrl}}" style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Your Form</a>
        </div>
        
        <p>This information will help us create a customized marketing strategy for your property.</p>
        
        <p>Best regards,<br>{{agentName}}</p>
      </div>
    `
  },
  form_completion_summary: {
    subject: 'Form Completed: {{clientName}} ({{formType}})',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Form Completed Successfully!</h2>
        <p><strong>Client:</strong> {{clientName}}</p>
        <p><strong>Email:</strong> {{clientEmail}}</p>
        <p><strong>Type:</strong> {{formType}}</p>
        <p><strong>Submitted:</strong> {{submittedAt}}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{sheetUrl}}" style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Google Sheet</a>
        </div>
        
        <p>The client has completed their form and all data has been processed. You can view the complete details in the Google Sheet above.</p>
        
        <p>Best regards,<br>{{agentName}}</p>
      </div>
    `
  }
};

function replaceTemplateVariables(template: string, data: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }
  return result;
}

// Set up IPC handler for email sending
export function setupEmailHandler() {
  ipcMain.handle('send-email', async (event, emailData) => {
    try {
      console.log('📧 Main process: Sending email to:', emailData.to);
      
      const templateData = templates[emailData.template as keyof typeof templates];
      if (!templateData) {
        throw new Error(`Template "${emailData.template}" not found`);
      }

      const subject = replaceTemplateVariables(templateData.subject, emailData.data);
      const html = replaceTemplateVariables(templateData.html, emailData.data);

      const mailOptions = {
        from: {
          name: 'Real Estate Agent',
          address: 'damonbodine@gmail.com'
        },
        to: emailData.to,
        subject: subject,
        html: html
      };

      const result = await transporter.sendMail(mailOptions);
      
      console.log('✅ Main process: Email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Main process: Email sending failed:', error);
      throw error;
    }
  });
  
  console.log('📧 Email handler registered in main process');
}