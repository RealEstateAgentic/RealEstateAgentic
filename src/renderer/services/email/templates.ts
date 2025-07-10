// Email service for sending automated emails
// This uses nodemailer for actual email sending

import nodemailer from 'nodemailer';

interface EmailTemplateData {
  to: string;
  template: string;
  data: Record<string, any>;
}

// Create transporter for Gmail SMTP
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'damon.bodine@gauntletai.com', // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password-here' // Gmail App Password
  }
});

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

export async function sendEmailWithTemplate({ to, template, data }: EmailTemplateData): Promise<void> {
  try {
    console.log('📧 Sending REAL email to:', to);
    console.log('📧 Template:', template);
    
    const templateData = templates[template as keyof typeof templates];
    if (!templateData) {
      throw new Error(`Template "${template}" not found`);
    }

    const subject = replaceTemplateVariables(templateData.subject, data);
    const html = replaceTemplateVariables(templateData.html, data);

    console.log('📧 Email details:');
    console.log('  To:', to);
    console.log('  Subject:', subject);
    console.log('  From: damon.bodine@gauntletai.com');
    
    // Check if we have Gmail credentials
    const hasCredentials = process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_APP_PASSWORD !== 'your-app-password-here';
    
    if (!hasCredentials) {
      console.log('⚠️  Gmail credentials not configured, simulating email send');
      console.log('📧 HTML Preview:', html.substring(0, 200) + '...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Email simulated successfully');
      return;
    }

    // Send actual email using nodemailer
    console.log('📧 Sending actual email via Gmail SMTP...');
    
    const mailOptions = {
      from: {
        name: 'Real Estate Agent',
        address: 'damon.bodine@gauntletai.com'
      },
      to: to,
      subject: subject,
      html: html
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
}