export type CommitteeStatus = 'forming' | 'active' | 'frozen' | 'closed';
export type CommitteeScope = 'internal' | 'external' | 'regional' | 'international' | 'sector';
export type CommitteeType = 'regulatory' | 'technical' | 'advisory' | 'executive';

export interface Committee {
  id: string;
  name: string;
  nameEn?: string;
  type?: CommitteeType;
  scope: CommitteeScope;
  department?: DepartmentKey;
  sector?: SectorKey;
  representative?: string;
  head?: string;
  organizer?: string;
  members?: number;
  startDate?: string;
  endDate?: string;
  status: CommitteeStatus;
  active: boolean;
  confidentiality?: 'public' | 'restricted' | 'secret';
  budget?: number;
  notes?: string;
}

export type DepartmentKey =
  | 'marine'
  | 'geodesy'
  | 'land'
  | 'remoteSensing'
  | 'services';

export type SectorKey =
  | 'survey'
  | 'investment'
  | 'knowledge'
  | 'center'
  | 'surveyWorks';

export type RequestStatus = 'new' | 'inProgress' | 'completed' | 'late' | 'onTime' | 'followUp';
export type RequestPriority = 'high' | 'medium' | 'low';
export type RequestDirection = 'in' | 'out';
export type RequestClassification = 'internal' | 'external';
export type RequestPurpose = 'completion' | 'feedback' | 'approval' | 'update';
export type RequestType = 'president' | 'deputy' | 'internal' | 'task';

export interface RequestRecord {
  id: string;
  name: string;
  type?: RequestType;
  requester?: string;
  classification?: RequestClassification;
  priority?: RequestPriority;
  sector?: SectorKey;
  department?: DepartmentKey;
  purpose?: RequestPurpose;
  direction?: RequestDirection;
  txnNumber?: string;
  txnName?: string;
  status: RequestStatus;
  owner?: string;
  date?: string;
  dueDate?: string;
}

export type TaskKind = 'routine' | 'team';
export type TaskStatus = 'planned' | 'inProgress' | 'completed' | 'overdue' | 'onHold';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface TaskRecord {
  id: string;
  title: string;
  description?: string;
  kind: TaskKind;
  team?: string;
  committeeId?: string;
  department?: DepartmentKey;
  assignee?: string;
  priority: TaskPriority;
  status: TaskStatus;
  frequency?: TaskFrequency;
  dueDate?: string;
  lastRun?: string;
  nextRun?: string;
  progress: number;
}
