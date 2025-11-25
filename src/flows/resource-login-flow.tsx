/**
 * Resource Login Help Ticket Flow
 *
 * This flow handles ticket creation for users having trouble logging into
 * an ACCESS-affiliated resource (e.g., Expanse, Bridges-2, Anvil).
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
import { resolveFlow, type FlowInput, type ChatState } from '../utils/flow-helpers';

interface FlowParams {
  ticketForm: TicketFormData;
  setTicketForm: (form: TicketFormData | ((prev: TicketFormData) => TicketFormData)) => void;
  userInfo: UserInfo;
}

/**
 * Creates the Resource Login help ticket flow
 *
 * Note: chatDisabled is auto-detected based on options:
 * - Steps with options → buttons only (no text input)
 * - Steps without options → text input enabled
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

  const flow: FlowInput = {
    // Entry point - provides context and asks if user wants to create ticket
    resource_help: {
      message: "If you're having trouble logging into an ACCESS-affiliated resource, here are some common issues:\n\n" +
               "• Make sure your ACCESS account is linked to the resource\n" +
               "• Check that your allocation on the resource is active\n" +
               "• Verify you're using the correct username for that resource\n" +
               "• Some resources require SSH keys or two-factor authentication\n\n" +
               "Would you like to submit a help ticket for resource login issues?",
      options: ["Yes, let's create a ticket", "Back to Main Menu"],
      path: (chatState: ChatState) =>
        chatState.userInput === "Yes, let's create a ticket"
          ? "resource_login_description"
          : "start",
    },

    // Step 1: Describe the issue
    resource_login_description: {
      message: "Describe your login issue.",
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
      path: "resource_login_which_resource",
    },

    // Step 2: Which resource
    resource_login_which_resource: {
      message: "Which resource are you trying to access?",
      options: [
        "Anvil (Purdue)",
        "Bridges-2 (PSC)",
        "Darwin (UD)",
        "Delta (NCSA)",
        "Expanse (SDSC)",
        "Frontera (TACC)",
        "Jetstream2",
        "Ookami (Stony Brook)",
        "Stampede3 (TACC)",
        "Other",
      ],
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, resourceName: chatState.userInput });
      },
      path: "resource_login_username",
    },

    // Step 3: Username at resource (optional)
    resource_login_username: {
      message: "What is your username at this resource? (Optional - press Enter to skip)",
      validateTextInput: createOptionalFieldValidator(),
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, userIdAtResource: processOptionalInput(chatState.userInput) });
      },
      path: "resource_login_identity",
    },

    // Step 4: Identity provider
    resource_login_identity: {
      message: "Which identity provider were you using?",
      options: ["ACCESS", "Github", "Google", "Institution", "Microsoft", "ORCID", "Other"],
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, identityProvider: chatState.userInput });
      },
      path: "resource_login_browser",
    },

    // Step 5: Browser
    resource_login_browser: {
      message: "Which browser were you using?",
      options: ["Chrome", "Firefox", "Edge", "Safari", "SSH/Terminal", "Other"],
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, browser: chatState.userInput });
      },
      path: "resource_login_attachment",
    },

    // Step 6: Ask about attachment
    resource_login_attachment: {
      message: "Would you like to attach a screenshot or error log?",
      options: ["Yes", "No"],
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

    // Step 7: File upload (conditional)
    resource_login_upload: {
      message: "Please upload your screenshot or error log.",
      component: fileUploadElement,
      options: ["Continue"],
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

    // Step 8: Email (if not provided)
    resource_login_email: {
      message: "What is your email?",
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

    // Step 9: Name (if not provided)
    resource_login_name: {
      message: "What is your name?",
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

    // Step 10: ACCESS ID (optional)
    resource_login_accessid: {
      message: "What is your ACCESS ID? (Optional - press Enter to skip)",
      validateTextInput: createOptionalFieldValidator(),
      function: (chatState: ChatState) => {
        const currentForm = getCurrentTicketForm();
        setTicketForm({ ...currentForm, accessId: processOptionalInput(chatState.userInput) });
      },
      path: "resource_login_summary",
    },

    // Step 11: Summary and confirmation
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
               `Resource: ${currentForm.resourceName || 'Not provided'}\n` +
               `Username at Resource: ${currentForm.userIdAtResource || 'Not provided'}\n` +
               `Identity Provider: ${currentForm.identityProvider || 'Not provided'}\n` +
               `Browser: ${currentForm.browser || 'Not provided'}\n` +
               `Issue Description: ${currentForm.description || 'Not provided'}${fileInfo}\n\n` +
               `Would you like to submit this ticket?`;
      },
      options: ["Submit Ticket", "Back to Main Menu"],
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
            resourceName: currentForm.resourceName || "",
            userIdAtResource: currentForm.userIdAtResource || "",
            identityProvider: currentForm.identityProvider || "",
            browser: currentForm.browser || "",
          };

          await handleSubmit(formData, currentForm.uploadedFiles || []);
        }
      },
      path: (chatState: ChatState) =>
        chatState.userInput === "Submit Ticket" ? "resource_login_success" : "start",
    },

    // Step 12: Success message
    resource_login_success: {
      message: () => generateSuccessMessage(submissionResult, 'resource login ticket'),
      options: ["Back to Main Menu"],
      renderHtml: ["BOT"],
      path: "start",
    },
  };

  return resolveFlow(flow);
}
