import { Area } from './area.model';

export interface Community{
  areaId?: string;
  communityId?: string;
  name: string;
  subtitle?: string;
  details?: string;
  requester?: {
    uid: string;
    timestamp: number;
  };
  isPending?: boolean;
  members?: string[];
  membersCount?: number;

  postsCount?: number;
}