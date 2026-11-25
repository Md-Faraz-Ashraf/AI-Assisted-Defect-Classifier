export const DEFECT_TYPES = [
  "Scratch",
  "Dent",
  "Paint Issue",
  "Missing Component",
  "No Defect",
] as const;

export type DefectType = (typeof DEFECT_TYPES)[number];
export type UserRole = "QUALITY_ENGINEER" | "PRODUCTION_SUPERVISOR";
export type InspectionStatus = "UNREVIEWED" | "REVIEWED";

export interface DemoUser {
  user_id: string;
  name: string;
  role: UserRole;
}

export interface Batch {
  batch_id: string;
  batch_number: string;
  product_name: string;
  production_line: string;
}

export interface Prediction {
  defect_type: DefectType;
  confidence: number;
  provider: string;
  model: string;
}

export interface AIAnalysis {
  analysis_id: string;
  status: InspectionStatus;
  batch_id: string;
  image_url: string;
  prediction: Prediction;
  created_at: string;
}

export interface Inspection {
  inspection_id: string;
  status: InspectionStatus;
  batch_id: string;
  batch_number: string;
  product_name: string;
  inspector_id: string;
  inspector_name: string;
  image_ref: string;
  image_url: string;
  original_ai_prediction: DefectType;
  ai_confidence: number;
  ai_provider: string;
  ai_model: string;
  final_defect_type: DefectType;
  was_overridden: boolean;
  comments: string | null;
  inspected_at: string;
}

export interface InspectionPage {
  items: Inspection[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface DefectCount {
  defect_type: DefectType;
  count: number;
}

export interface DashboardSummary {
  total_inspections: number;
  passed_inspections: number;
  rejected_inspections: number;
  defect_rate: number;
  ai_acceptance_rate: number;
  defect_breakdown: DefectCount[];
}

export interface InspectionFilters {
  defect_type?: DefectType;
  batch_id?: string;
  inspector_id?: string;
  date_from?: string;
  date_to?: string;
  page: number;
  page_size: number;
  sort_by?: "inspected_at" | "batch_id" | "final_defect_type" | "inspector_id";
  sort_order?: "asc" | "desc";
}

export interface InspectionSubmission {
  analysis_id: string;
  final_defect_type: DefectType;
  comments?: string;
}
