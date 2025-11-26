/**
 * ACCESS Login Help Ticket Flow
 *
 * This flow handles ticket creation for users having trouble logging into ACCESS.
 * It demonstrates how to wrap qa-bot-core's FileUploadComponent with ACCESS-specific
 * ticket submission logic.
 */

import React from 'react';
import { FileUploadComponent } from '@snf/qa-bot-core';
import {
  getCurrentTicketForm,
  getCurrentFormWithUserInfo,
  getFileInfo,
  type TicketFormData,
  type UserInfo,
} from '../utils/flow-context';
import { submitTicket, generateSuccessMessage, type TicketSubmissionResult } from '../utils/ticket-api';
import { validateEmail, createOptionalFieldValidator, processOptionalInput } from '../utils/validation';

interface FlowParams {
  ticketForm: TicketFormData;
  setTicketForm: (form: TicketFormData | ((prev: TicketFormData) => TicketFormData)) => void;
  userInfo: UserInfo;
}

interface ChatState {
  userInput: string;
  prevPath?: string;
}

/**
 * Creates the ACCESS login help ticket flow
 *
 * chatDisabled behavior:
 * - Steps with options: set chatDisabled: true (buttons only)
 * - Steps without options: omit chatDisabled (defaults to enabled for text input)
 */
export function createAccessLoginFlow({ ticketForm: _ticketForm, setTicketForm, userInfo }: FlowParams) {
  // Submission handler - stores result for success message
  let submissionResult: TicketSubmissionResult | null = null;

  const handleSubmit = async (formData: Record<string, unknown>, uploadedFiles: File[] = []) => {
    submissionResult = await submitTicket(formData, 'loginAccess', uploadedFiles);
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

  // File upload component - wired to update form state
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
    // Entry point - provides context and asks if user wants to create ticket
    access_help: {
      message: "If you're having trouble logging into the ACCESS website, here are some common issues:\n\n" +
               "• Make sure you're using a supported browser (Chrome, Firefox, Safari)\n" +
               "• Clear your browser cookies and cache\n" +
               "• Check if you're using the correct identity provider\n\n" +
               "Would you like to submit a help ticket for ACCESS login issues?",
      options: ["Yes, let's create a ticket", "Back to Main Menu"],
      chatDisabled: true,
      path: (chatState: ChatState) =>
        chatState.userInput === "Yes, let's create a ticket"
          ? "access_login_description"
          : "start",
    },

    // Step 1: Describe the issue (text input)
    access_login_description: {
      message: "Describe your login issue.",
      chatDisabled: false,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({
          ...currentForm,
          description: chatState.userInput,
          email: userInfo.email || currentForm.email,
          name: userInfo.name || currentForm.name,
          accessId: userInfo.accessId || currentForm.accessId,
        });
      },
      path: "access_login_identity",
    },

    // Step 2: Identity provider (options)
    access_login_identity: {
      message: "Which identity provider were you using?",
      options: ["ACCESS", "Github", "Google", "Institution", "Microsoft", "ORCID", "Other"],
      chatDisabled: true,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, identityProvider: chatState.userInput });
      },
      path: "access_login_browser",
    },

    // Step 3: Browser (options)
    access_login_browser: {
      message: "Which browser were you using?",
      options: ["Chrome", "Firefox", "Edge", "Safari", "Other"],
      chatDisabled: true,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, browser: chatState.userInput });
      },
      path: "access_login_attachment",
    },

    // Step 4: Ask about attachment (options)
    access_login_attachment: {
      message: "Would you like to attach a screenshot?",
      options: ["Yes", "No"],
      chatDisabled: true,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, wantsAttachment: chatState.userInput });
      },
      path: (chatState: ChatState) => {
        if (chatState.userInput === "Yes") {
          return "access_login_upload";
        }
        // Skip to user info collection based on what's missing
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        if (!formWithUserInfo.email) return "access_login_email";
        if (!formWithUserInfo.name) return "access_login_name";
        if (!formWithUserInfo.accessId) return "access_login_accessid";
        return "access_login_summary";
      },
    },

    // Step 5: File upload (component + Continue button)
    access_login_upload: {
      message: "Please upload your screenshot.",
      component: fileUploadElement,
      options: ["Continue"],
      chatDisabled: true,
      function: () => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, uploadConfirmed: true });
      },
      path: () => {
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        if (!formWithUserInfo.email) return "access_login_email";
        if (!formWithUserInfo.name) return "access_login_name";
        if (!formWithUserInfo.accessId) return "access_login_accessid";
        return "access_login_summary";
      },
    },

    // Step 6: Email (text input)
    access_login_email: {
      message: "What is your email?",
      chatDisabled: false,
      validateTextInput: validateEmail,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, email: chatState.userInput });
      },
      path: () => {
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        if (!formWithUserInfo.name) return "access_login_name";
        if (!formWithUserInfo.accessId) return "access_login_accessid";
        return "access_login_summary";
      },
    },

    // Step 7: Name (text input)
    access_login_name: {
      message: "What is your name?",
      chatDisabled: false,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, name: chatState.userInput });
      },
      path: () => {
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        if (!formWithUserInfo.accessId) return "access_login_accessid";
        return "access_login_summary";
      },
    },

    // Step 8: ACCESS ID (text input, optional)
    access_login_accessid: {
      message: "What is your ACCESS ID? (Optional - press Enter to skip)",
      chatDisabled: false,
      validateTextInput: createOptionalFieldValidator(),
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, accessId: processOptionalInput(chatState.userInput) });
      },
      path: "access_login_summary",
    },

    // Step 9: Summary and confirmation (options)
    access_login_summary: {
      message: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        const fileInfo = getFileInfo(currentForm.uploadedFiles);

        // Handle ACCESS ID timing issue
        let finalAccessId = formWithUserInfo.accessId;
        if (chatState.prevPath === 'access_login_accessid' && chatState.userInput) {
          finalAccessId = chatState.userInput;
        }

        return `Thank you for providing your ACCESS login issue details. Here's a summary:\n\n` +
               `Name: ${formWithUserInfo.name || 'Not provided'}\n` +
               `Email: ${formWithUserInfo.email || 'Not provided'}\n` +
               `ACCESS ID: ${finalAccessId || 'Not provided'}\n` +
               `Identity Provider: ${currentForm.identityProvider || 'Not provided'}\n` +
               `Browser: ${currentForm.browser || 'Not provided'}\n` +
               `Issue Description: ${currentForm.description || 'Not provided'}${fileInfo}\n\n` +
               `Would you like to submit this ticket?`;
      },
      options: ["Submit Ticket", "Back to Main Menu"],
      chatDisabled: true,
      renderHtml: ["BOT", "USER"],
      function: async (chatState: ChatState) => {
        if (chatState.userInput === "Submit Ticket") {
          const currentForm = getCurrentTicketForm();
          const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
          const formData = {
            email: formWithUserInfo.email || "",
            name: formWithUserInfo.name || "",
            accessId: formWithUserInfo.accessId || "",
            description: currentForm.description || "",
            identityProvider: currentForm.identityProvider || "",
            browser: currentForm.browser || "",
          };

          await handleSubmit(formData, currentForm.uploadedFiles || []);
        }
      },
      path: (chatState: ChatState) =>
        chatState.userInput === "Submit Ticket" ? "access_login_success" : "start",
    },

    // Step 10: Success message (options)
    access_login_success: {
      message: () => generateSuccessMessage(submissionResult, 'ACCESS login ticket'),
      options: ["Back to Main Menu"],
      chatDisabled: true,
      renderHtml: ["BOT"],
      path: "start",
    },
  };
}
