/**
 * Security Incident Flow
 *
 * Multi-step form for reporting security incidents.
 * Based on the old qa-bot's security-flow.js with exact language preserved.
 */

import React from 'react';
import { FileUploadComponent } from '@snf/qa-bot-core';
import { getCurrentTicketForm, type TicketFormData, type UserInfo } from '../utils/flow-context';
import { submitTicket, type TicketSubmissionResult } from '../utils/ticket-api';
import { validateEmail, createOptionalFieldValidator, processOptionalInput } from '../utils/validation';

interface FlowParams {
  ticketForm: TicketFormData;
  setTicketForm: (form: TicketFormData | ((prev: TicketFormData) => TicketFormData)) => void;
  userInfo: UserInfo;
}

interface ChatState {
  userInput: string;
}

/**
 * Gets current form merged with user info
 */
function getCurrentFormWithUserInfo(userInfo: UserInfo): TicketFormData {
  const currentForm = getCurrentTicketForm() as TicketFormData;
  return {
    ...currentForm,
    email: userInfo.email || currentForm.email,
    name: userInfo.name || currentForm.name,
    accessId: userInfo.accessId || currentForm.accessId,
  };
}

/**
 * Generates success message for security incidents
 */
function generateSecuritySuccessMessage(result: TicketSubmissionResult | null): string {
  if (!result) {
    return `We apologize, but there was an error submitting your security incident report.\n\nPlease try again or contact our cybersecurity team directly.`;
  }

  if (!result.success) {
    return `We apologize, but there was an error submitting your security incident report: ${result.error}\n\nPlease try again or contact our cybersecurity team directly.`;
  }

  if (result.ticketUrl && result.ticketKey) {
    return `Your security incident report has been submitted successfully.\n\nTicket: <a href="${result.ticketUrl}" target="_blank">${result.ticketKey}</a>\n\nOur cybersecurity team will review your report and respond accordingly. Thank you for helping keep ACCESS secure.`;
  }

  return `Your security incident report has been submitted successfully.\n\nOur cybersecurity team will review your report and respond accordingly. Thank you for helping keep ACCESS secure.`;
}

/**
 * Creates the Security Incident flow
 */
export function createSecurityFlow({ ticketForm: _ticketForm, setTicketForm, userInfo }: FlowParams) {
  // Store the most recent ACCESS ID input to handle timing issues
  let mostRecentAccessId: string | null = null;

  // Submission handler - stores result for success message
  let submissionResult: TicketSubmissionResult | null = null;

  const handleSubmit = async (formData: Record<string, unknown>, uploadedFiles: File[] = []) => {
    submissionResult = await submitTicket(formData, 'security', uploadedFiles);
    if (submissionResult.success) {
      setTicketForm(prev => ({
        ...prev,
        ticketKey: submissionResult!.ticketKey,
        ticketUrl: submissionResult!.ticketUrl,
      }));
    } else {
      setTicketForm(prev => ({
        ...prev,
        submissionError: submissionResult!.error,
      }));
    }
  };

  // File upload component
  const fileUploadElement = (
    <FileUploadComponent
      onFileUpload={(files) => {
        setTicketForm(prev => ({
          ...prev,
          uploadedFiles: files,
        }));
      }}
      enableScreenshot={true}
      maxSizeMB={10}
    />
  );

  return {
    // Step 1: Summary (text input)
    security_incident: {
      message: "You're reporting a security incident. Please provide a brief summary of the security concern.",
      chatDisabled: false,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm() as TicketFormData;
        setTicketForm({
          ...currentForm,
          summary: chatState.userInput,
          email: userInfo.email || currentForm.email,
          name: userInfo.name || currentForm.name,
          accessId: userInfo.accessId || currentForm.accessId,
        });
      },
      path: "security_priority",
    },

    // Step 2: Priority (options)
    security_priority: {
      message: "What is the priority level of this security incident?",
      options: ["Critical", "High", "Medium", "Low"],
      chatDisabled: true,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm() as TicketFormData;
        setTicketForm({ ...currentForm, priority: chatState.userInput.toLowerCase() });
      },
      path: "security_description",
    },

    // Step 3: Description (text input)
    security_description: {
      message: "Please provide a detailed description of the security incident or concern.",
      chatDisabled: false,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm() as TicketFormData;
        setTicketForm({ ...currentForm, description: chatState.userInput });
      },
      path: "security_attachment",
    },

    // Step 4: Attachment? (options)
    security_attachment: {
      message: "Do you have any files (screenshots, logs, etc.) that would help with this security incident?",
      options: ["Yes", "No"],
      chatDisabled: true,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm() as TicketFormData;
        setTicketForm({ ...currentForm, wantsAttachment: chatState.userInput });
      },
      path: (chatState: ChatState) =>
        chatState.userInput === "Yes" ? "security_upload" : "security_contact_check",
    },

    // Step 5: File upload (conditional)
    security_upload: {
      message: "Please upload your files.",
      component: fileUploadElement,
      options: ["Continue"],
      chatDisabled: true,
      function: () => {
        const currentForm = getCurrentTicketForm() as TicketFormData;
        setTicketForm({ ...currentForm, uploadConfirmed: true });
      },
      path: "security_contact_check",
    },

    // Step 6: Check if we have user info (branching)
    security_contact_check: {
      message: () => {
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        if (formWithUserInfo.name && formWithUserInfo.email && formWithUserInfo.accessId) {
          return `I have your contact information:\n\nName: ${formWithUserInfo.name}\nEmail: ${formWithUserInfo.email}\nACCESS ID: ${formWithUserInfo.accessId}\n\nIs this correct?`;
        }
        return "I need your contact information.";
      },
      options: () => {
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        if (formWithUserInfo.name && formWithUserInfo.email && formWithUserInfo.accessId) {
          return ["Yes, that's correct", "Let me update it"];
        }
        return [];
      },
      chatDisabled: () => {
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        // Disable only when showing options (have all info)
        return !!(formWithUserInfo.name && formWithUserInfo.email && formWithUserInfo.accessId);
      },
      path: (chatState: ChatState) => {
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        if (chatState.userInput === "Yes, that's correct") {
          return "security_summary";
        } else if (chatState.userInput === "Let me update it") {
          return "security_name";
        }
        // No user info - go collect it
        return "security_email";
      },
    },

    // Step 7: Email (text input, conditional)
    security_email: {
      message: "What is your email address?",
      chatDisabled: false,
      validateTextInput: validateEmail,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm() as TicketFormData;
        setTicketForm({ ...currentForm, email: chatState.userInput });
      },
      path: () => {
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        if (!formWithUserInfo.name) return "security_name";
        if (!formWithUserInfo.accessId) return "security_accessid";
        return "security_summary";
      },
    },

    // Step 8: Name (text input, conditional)
    security_name: {
      message: "What is your name?",
      chatDisabled: false,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm() as TicketFormData;
        setTicketForm({ ...currentForm, name: chatState.userInput });
      },
      path: () => {
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        if (!formWithUserInfo.email) return "security_email";
        if (!formWithUserInfo.accessId) return "security_accessid";
        return "security_summary";
      },
    },

    // Step 9: ACCESS ID (text input, optional)
    security_accessid: {
      message: "What is your ACCESS ID? (Optional - press Enter to skip)",
      chatDisabled: false,
      validateTextInput: createOptionalFieldValidator(),
      function: (chatState: ChatState) => {
        const finalInput = processOptionalInput(chatState.userInput);
        mostRecentAccessId = finalInput;
        const currentForm = getCurrentTicketForm() as TicketFormData;
        setTicketForm({ ...currentForm, accessId: finalInput });
      },
      path: "security_summary",
    },

    // Step 10: Summary and confirmation
    security_summary: {
      message: () => {
        const currentForm = getCurrentTicketForm() as TicketFormData;
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);

        // Create a merged form with the most recent data
        const finalForm = {
          ...currentForm,
          name: formWithUserInfo.name || currentForm.name,
          email: formWithUserInfo.email || currentForm.email,
          accessId: mostRecentAccessId || formWithUserInfo.accessId || currentForm.accessId,
        };

        let fileInfo = '';
        if (currentForm.uploadedFiles && currentForm.uploadedFiles.length > 0) {
          fileInfo = `\nAttachments: ${currentForm.uploadedFiles.length} file(s) attached`;
        }

        const accessIdDisplay = finalForm.accessId || 'Not provided';

        return `Here's a summary of your security incident report:\n\n` +
          `Summary: ${finalForm.summary || 'Not provided'}\n` +
          `Priority: ${finalForm.priority || 'Not provided'}\n` +
          `Name: ${finalForm.name || 'Not provided'}\n` +
          `Email: ${finalForm.email || 'Not provided'}\n` +
          `ACCESS ID: ${accessIdDisplay}\n` +
          `Description: ${finalForm.description || 'Not provided'}${fileInfo}\n\n` +
          `Would you like to submit this security incident report?`;
      },
      options: ["Submit Security Report", "Back to Main Menu"],
      chatDisabled: true,
      function: async (chatState: ChatState) => {
        if (chatState.userInput === "Submit Security Report") {
          const currentForm = getCurrentTicketForm() as TicketFormData;
          const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);

          // Create final merged form
          const finalForm = {
            ...currentForm,
            name: formWithUserInfo.name || currentForm.name,
            email: formWithUserInfo.email || currentForm.email,
            accessId: mostRecentAccessId || formWithUserInfo.accessId || currentForm.accessId,
          };

          // Prepare form data for submission
          const formData = {
            summary: finalForm.summary || "",
            priority: finalForm.priority || "",
            description: finalForm.description || "",
            name: finalForm.name || "",
            email: finalForm.email || "",
            accessId: finalForm.accessId || "",
          };

          await handleSubmit(formData, currentForm.uploadedFiles || []);
        }
      },
      path: (chatState: ChatState) => {
        if (chatState.userInput === "Submit Security Report") {
          return "security_success";
        }
        return "start";
      },
    },

    // Step 11: Success message
    security_success: {
      message: () => {
        const currentForm = getCurrentTicketForm() as TicketFormData;
        return generateSecuritySuccessMessage(submissionResult);
      },
      options: ["Back to Main Menu"],
      chatDisabled: true,
      renderHtml: ["BOT"],
      path: "start",
    },
  };
}

