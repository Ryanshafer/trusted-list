import * as React from "react";
import type { AskContact } from "@/features/requests/components/HelpRequestDialog";

/**
 * Owns the category-specific sub-fields (introduction target, opportunity intent,
 * mentorship duration, vouch type/skill, connect company, feedback attachment) and
 * resets each one whenever the selected category no longer matches it.
 */
export function useCategoryContextState(selectedCategory: string | undefined) {
  const [introSearchTerm, setIntroSearchTerm] = React.useState("");
  const [selectedIntroContact, setSelectedIntroContact] = React.useState<AskContact | null>(null);
  const [opportunityIntent, setOpportunityIntent] = React.useState<"hire" | "get-hired" | "">("");
  const [mentorshipDuration, setMentorshipDuration] = React.useState<"short-term" | "long-term" | "">("");
  const [vouchType, setVouchType] = React.useState<"myself" | "skill" | "">("");
  const [vouchSkill, setVouchSkill] = React.useState<string | null>(null);
  const [vouchSkillOpen, setVouchSkillOpen] = React.useState(false);
  const [connectCompany, setConnectCompany] = React.useState<string | null>(null);
  const [connectCompanyOpen, setConnectCompanyOpen] = React.useState(false);
  const [feedbackAttachment, setFeedbackAttachment] = React.useState<"link" | "file" | "">("");
  const [feedbackLink, setFeedbackLink] = React.useState("");
  const [feedbackFile, setFeedbackFile] = React.useState<File | null>(null);

  const isIntroduction = selectedCategory === "introduction";
  const isOpportunity = selectedCategory === "opportunity";
  const isMentorship = selectedCategory === "mentorship";
  const isVouch = selectedCategory === "endorse";
  const isConnect = selectedCategory === "connect";
  const isFeedback = selectedCategory === "feedback";

  const resetIntroduction = React.useCallback(() => {
    setSelectedIntroContact(null);
    setIntroSearchTerm("");
  }, []);

  const resetVouch = React.useCallback(() => {
    setVouchType("");
    setVouchSkill(null);
    setVouchSkillOpen(false);
  }, []);

  const resetConnect = React.useCallback(() => {
    setConnectCompany(null);
    setConnectCompanyOpen(false);
  }, []);

  const resetFeedback = React.useCallback(() => {
    setFeedbackAttachment("");
    setFeedbackLink("");
    setFeedbackFile(null);
  }, []);

  React.useEffect(() => {
    if (!isIntroduction) resetIntroduction();
  }, [isIntroduction, resetIntroduction]);

  React.useEffect(() => {
    if (!isOpportunity) setOpportunityIntent("");
  }, [isOpportunity]);

  React.useEffect(() => {
    if (!isMentorship) setMentorshipDuration("");
  }, [isMentorship]);

  React.useEffect(() => {
    if (!isVouch) resetVouch();
  }, [isVouch, resetVouch]);

  React.useEffect(() => {
    if (!isConnect) resetConnect();
  }, [isConnect, resetConnect]);

  React.useEffect(() => {
    if (!isFeedback) resetFeedback();
  }, [isFeedback, resetFeedback]);

  /** Resets everything the create-flow dialog clears when it closes. */
  const resetAllOnDialogClose = React.useCallback(() => {
    resetVouch();
    setOpportunityIntent("");
    setMentorshipDuration("");
    resetIntroduction();
    resetFeedback();
  }, [resetVouch, resetIntroduction, resetFeedback]);

  return {
    introSearchTerm,
    setIntroSearchTerm,
    selectedIntroContact,
    setSelectedIntroContact,
    opportunityIntent,
    setOpportunityIntent,
    mentorshipDuration,
    setMentorshipDuration,
    vouchType,
    setVouchType,
    vouchSkill,
    setVouchSkill,
    vouchSkillOpen,
    setVouchSkillOpen,
    connectCompany,
    setConnectCompany,
    connectCompanyOpen,
    setConnectCompanyOpen,
    feedbackAttachment,
    setFeedbackAttachment,
    feedbackLink,
    setFeedbackLink,
    feedbackFile,
    setFeedbackFile,
    isIntroduction,
    isOpportunity,
    isMentorship,
    isVouch,
    isConnect,
    isFeedback,
    resetIntroduction,
    resetVouch,
    resetConnect,
    resetFeedback,
    resetAllOnDialogClose,
  };
}

export type CategoryContextState = ReturnType<typeof useCategoryContextState>;
