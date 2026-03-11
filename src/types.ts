
export interface Stage {
  id: string;
  stepNumber: string;
  title: string;
  description: string;
  template?: string;
  category: 'PRE' | 'EXECUTION' | 'POST';
  requiredFields?: string[];
}

export interface Client {
  id: string;
  name: string;
  clientNumber: string;
  prgd: string;
  phone: string;
  titularName?: string;
  projectName: string;
  additionalNotes: string;
  currentStageId: string;
  email?: string;
  createdAt: string; // ISO string
  stageHistory: Record<string, string>; // Maps stageId -> ISO string of completion
  stageData?: Record<string, string>;
}

export interface GeneratedContent {
  subject: string;
  body: string;
  tips?: string[];
}
