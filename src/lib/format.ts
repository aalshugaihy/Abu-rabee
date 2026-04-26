import { TranslationKey, translations } from '../i18n/translations';
import {
  Committee,
  CommitteeStatus,
  CommitteeScope,
  CommitteeType,
  DepartmentKey,
  RequestPriority,
  RequestPurpose,
  RequestStatus,
  RequestType,
  RequestDirection,
  RequestClassification,
  SectorKey,
  TaskFrequency,
  TaskPriority,
  TaskStatus,
} from '../data/types';

type TFn = (key: TranslationKey) => string;

export function tStatus(t: TFn, status: CommitteeStatus) {
  return t(`committees.status.${status}` as TranslationKey);
}
export function tCommitteeScope(t: TFn, s: CommitteeScope) {
  return t(`committees.scope.${s}` as TranslationKey);
}
export function tCommitteeType(t: TFn, s: CommitteeType) {
  return t(`committees.type.${s}` as TranslationKey);
}
export function tDept(t: TFn, d?: DepartmentKey) {
  if (!d) return '—';
  return t(`dept.${d}` as TranslationKey);
}
export function tSector(t: TFn, s?: SectorKey) {
  if (!s) return '—';
  return t(`sector.${s}` as TranslationKey);
}
export function tReqStatus(t: TFn, s: RequestStatus) {
  return t(`requests.status.${s}` as TranslationKey);
}
export function tReqPriority(t: TFn, p: RequestPriority) {
  return t(`requests.priority.${p}` as TranslationKey);
}
export function tReqPurpose(t: TFn, p: RequestPurpose) {
  return t(`requests.purpose.${p}` as TranslationKey);
}
export function tReqType(t: TFn, p: RequestType) {
  return t(`requests.type.${p}` as TranslationKey);
}
export function tReqDirection(t: TFn, d: RequestDirection) {
  return t(`requests.direction.${d}` as TranslationKey);
}
export function tReqClassification(t: TFn, c: RequestClassification) {
  return t(`requests.classification.${c}` as TranslationKey);
}
export function tTaskStatus(t: TFn, s: TaskStatus) {
  return t(`tasks.status.${s}` as TranslationKey);
}
export function tTaskPriority(t: TFn, p: TaskPriority) {
  return t(`requests.priority.${p}` as TranslationKey);
}
export function tTaskFrequency(t: TFn, f: TaskFrequency) {
  return t(`tasks.frequency.${f}` as TranslationKey);
}

export function committeeName(c: Committee, locale: 'ar' | 'en'): string {
  if (locale === 'en' && c.nameEn) return c.nameEn;
  return c.name;
}

export function statusToTone(status: CommitteeStatus | RequestStatus | TaskStatus) {
  switch (status) {
    case 'active':
    case 'completed':
    case 'onTime':
      return 'green' as const;
    case 'forming':
    case 'planned':
    case 'new':
      return 'blue' as const;
    case 'inProgress':
      return 'cyan' as const;
    case 'frozen':
    case 'onHold':
    case 'followUp':
      return 'amber' as const;
    case 'closed':
      return 'slate' as const;
    case 'late':
    case 'overdue':
      return 'rose' as const;
    default:
      return 'slate' as const;
  }
}

export function priorityToTone(p: RequestPriority | TaskPriority) {
  if (p === 'high') return 'rose' as const;
  if (p === 'medium') return 'amber' as const;
  return 'slate' as const;
}

// Used to enable type-checking the priority lookup keys above.
void translations;
