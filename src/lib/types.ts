export type Task = {
  id: string;
  orgId?: string;
  title: string;
  shortDescription: string;
  description?: string;
  language?: string;
  tags: string[];
  estimatedMinutes?: number;
  createdAt?: string;
  // New fields for task lifecycle management
  status?: 'active' | 'completed' | 'expired' | 'moderated';
  maxVolunteers?: number;
  deadline?: string;
  isVerified?: boolean;
  lastActivityAt?: string;
};

export type Claim = {
  id: string;
  taskId: string;
  userId?: string;
  notes?: string;
  proofUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
};

export type Badge = {
  id: string;
  userId: string;
  taskId?: string;
  label: string;
  color?: string;
  awardedAt: string;
};

export type BadgeDefinition = {
  id: string;
  orgId: string;
  label: string;
  color: string;       // hex
  icon?: string;       // iconify name (e.g. "hugeicons:trophy-01")
  criteria: 'task-completion' | 'task-specific' | 'time-based' | 'milestone' | 'custom';
  taskId?: string;     // when criteria === 'task-specific'
  description?: string;
  createdAt?: string;
};

export type NgoVerification = {
  id: string;
  userId: string;
  orgName: string;
  country: string;        // ISO-3166 alpha-2 (e.g. "US", "GB", "CA")
  taxId: string;          // EIN / charity number / registration ID
  docFileId?: string;     // Appwrite Storage file id (optional)
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;        // reviewer's note (rejections)
  submittedAt: string;
  reviewedBy?: string;    // admin userId
  reviewedAt?: string;
};

export type UserRole = 'anonymous' | 'user' | 'ngo' | 'volunteer';

export interface UserPreferences {
  role?: UserRole | string;
  orgName?: string;
  country?: string;
  taxId?: string;
  avatarUrl?: string;
  avatarFileId?: string;
  bio?: string;
  skills?: string[];
  verificationStatus?: string;
  [key: string]: unknown;
}

export interface VolunteerUserData {
  myClaims?: Array<Claim & { task?: { id: string; title: string; estimatedMinutes?: number } }>;
  approvedClaimsCount?: number;
  totalHours?: number;
  recommendations?: Task[];
  [key: string]: unknown;
}

export interface NgoUserData {
  myTasks?: Task[];
  pendingReviews?: Array<Claim & { task?: { id: string; title: string; estimatedMinutes?: number } }>;
  totalTasks?: number;
  pendingReviewsCount?: number;
  approvedClaimsCount?: number;
  totalHours?: number;
  myClaims?: Array<Claim & { task?: { id: string; title: string; estimatedMinutes?: number } }>;
  [key: string]: unknown;
}

export type DashboardUserData = VolunteerUserData | NgoUserData;
