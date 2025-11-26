/**
 * Resource/Affiliated Login Help Ticket Flow
 *
 * This flow handles ticket creation for users having trouble logging into
 * an ACCESS-affiliated resource (e.g., Expanse, Bridges-2, Anvil).
 *
 * Language matches: qa-bot/src/utils/flows/tickets/affiliated-login-flow.js
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
 * Creates the Resource/Affiliated Login help ticket flow
 */
export function createResourceLoginFlow({ ticketForm: _ticketForm, setTicketForm, userInfo }: FlowParams) {
  // Submission handler - stores result for success message
  let submissionResult: TicketSubmissionResult | null = null;

  const handleSubmit = async (formData: Record<string, unknown>, uploadedFiles: File[] = []) => {
    submissionResult = await submitTicket(formData, 'loginProvider', uploadedFiles);
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
    resource_help: {
      message: "If you're having trouble logging into an affiliated infrastructure or resource provider, here are some common issues:\n\n" +
               "• Ensure your allocation is active\n" +
               "• Confirm you have the correct username for that resource\n" +
               "• Check <a href=\"https://operations.access-ci.org/infrastructure_news_view\">System Status News</a> to see if the resource is undergoing maintenance\n\n" +
               "Would you like to submit a help ticket for resource provider login issues?",
      options: ["Yes, let's create a ticket", "Back to Main Menu"],
      chatDisabled: true,
      renderHtml: ["BOT"],
      path: (chatState: ChatState) =>
        chatState.userInput === "Yes, let's create a ticket"
          ? "resource_login_resource"
          : "start",
    },

    // Step 1: Which resource (options)
    resource_login_resource: {
      message: "Which ACCESS Resource are you trying to access?",
      options: [
        "ACES",
        "Anvil",
        "Bridges-2",
        "DARWIN",
        "Delta",
        "DeltaAI",
        "Derecho",
        "Expanse",
        "FASTER",
        "Granite",
        "Jetstream2",
        "KyRIC",
        "Launch",
        "Neocortex",
        "Ookami",
        "Open Science Grid",
        "Open Storage Network",
        "Ranch",
        "Stampede3",
      ],
      chatDisabled: true,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, resource: chatState.userInput });
      },
      path: "resource_login_userid",
    },

    // Step 2: User ID at resource (text input)
    resource_login_userid: {
      message: "What is your user ID at the resource?",
      chatDisabled: false,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, userIdResource: chatState.userInput });
      },
      path: "resource_login_description",
    },

    // Step 3: Describe the issue (text input)
    resource_login_description: {
      message: "Please describe the issue you're having logging in.",
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
      path: "resource_login_attachment",
    },

    // Step 4: Ask about attachment (options)
    resource_login_attachment: {
      message: "Would you like to attach a screenshot?",
      options: ["Yes", "No"],
      chatDisabled: true,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, wantsAttachment: chatState.userInput });
      },
      path: (chatState: ChatState) => {
        if (chatState.userInput === "Yes") {
          return "resource_login_upload";
        }
        // Skip to user info collection based on what's missing
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        if (!formWithUserInfo.email) return "resource_login_email";
        if (!formWithUserInfo.name) return "resource_login_name";
        if (!formWithUserInfo.accessId) return "resource_login_accessid";
        return "resource_login_summary";
      },
    },

    // Step 5: File upload (component + Continue button)
    resource_login_upload: {
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
        if (!formWithUserInfo.email) return "resource_login_email";
        if (!formWithUserInfo.name) return "resource_login_name";
        if (!formWithUserInfo.accessId) return "resource_login_accessid";
        return "resource_login_summary";
      },
    },

    // Step 6: Email (text input)
    resource_login_email: {
      message: "What is your email?",
      chatDisabled: false,
      validateTextInput: validateEmail,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, email: chatState.userInput });
      },
      path: () => {
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        if (!formWithUserInfo.name) return "resource_login_name";
        if (!formWithUserInfo.accessId) return "resource_login_accessid";
        return "resource_login_summary";
      },
    },

    // Step 7: Name (text input)
    resource_login_name: {
      message: "What is your name?",
      chatDisabled: false,
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, name: chatState.userInput });
      },
      path: () => {
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        if (!formWithUserInfo.accessId) return "resource_login_accessid";
        return "resource_login_summary";
      },
    },

    // Step 8: ACCESS ID (text input, optional)
    resource_login_accessid: {
      message: "What is your ACCESS ID? (Optional - press Enter to skip)",
      chatDisabled: false,
      validateTextInput: createOptionalFieldValidator(),
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, accessId: processOptionalInput(chatState.userInput) });
      },
      path: "resource_login_summary",
    },

    // Step 9: Summary and confirmation (options)
    resource_login_summary: {
      message: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
        const fileInfo = getFileInfo(currentForm.uploadedFiles);

        // Handle ACCESS ID timing issue
        let finalAccessId = formWithUserInfo.accessId;
        if (chatState.prevPath === 'resource_login_accessid' && chatState.userInput) {
          finalAccessId = chatState.userInput;
        }

        return `Thank you for providing your resource login issue details. Here's a summary:\n\n` +
               `Name: ${formWithUserInfo.name || 'Not provided'}\n` +
               `Email: ${formWithUserInfo.email || 'Not provided'}\n` +
               `ACCESS ID: ${finalAccessId || 'Not provided'}\n` +
               `Resource: ${currentForm.resource || 'Not provided'}\n` +
               `Resource User ID: ${currentForm.userIdResource || 'Not provided'}\n` +
               `Issue Description: ${currentForm.description || 'Not provided'}${fileInfo}\n\n` +
               `Would you like to submit this ticket?`;
      },
      options: ["Submit Ticket", "Back to Main Menu"],
      chatDisabled: true,
      function: async (chatState: ChatState) => {
        if (chatState.userInput === "Submit Ticket") {
          const currentForm = getCurrentTicketForm();
          const formWithUserInfo = getCurrentFormWithUserInfo(userInfo);
          const formData = {
            email: formWithUserInfo.email || "",
            name: formWithUserInfo.name || "",
            accessId: formWithUserInfo.accessId || "",
            accessResource: currentForm.resource || "",
            description: currentForm.description || "",
            // ProForma field for request type 31
            userIdAtResource: currentForm.userIdResource || "",
          };

          await handleSubmit(formData, currentForm.uploadedFiles || []);
        }
      },
      path: (chatState: ChatState) =>
        chatState.userInput === "Submit Ticket" ? "resource_login_success" : "start",
    },

    // Step 10: Success message (options)
    resource_login_success: {
      message: () => generateSuccessMessage(submissionResult, 'resource login ticket'),
      options: ["Back to Main Menu"],
      chatDisabled: true,
      renderHtml: ["BOT"],
      path: "start",
    },
  };
}
