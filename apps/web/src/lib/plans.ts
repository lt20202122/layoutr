import { ModelId } from "./credits";

export type PlanId = "free" | "hobby" | "pro" | "agency";

export const PLAN_ALLOWED_MODELS: Record<PlanId, ModelId[]> = {
  free: ["deepseek-chat"],
  hobby: ["deepseek-chat", "claude-sonnet-4-5"],
  pro: ["deepseek-chat", "claude-sonnet-4-5", "gpt-5.5"],
  agency: ["deepseek-chat", "claude-sonnet-4-5", "gpt-5.5"],
};
