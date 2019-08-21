import { User } from './user.model';

export interface Discussion {
  discussionId?: string;
  areaId?: string;
  communityId?: string;

  topic: string;
  details?: string;
  isActive: boolean;

  uid?: string;
  user?: User;
  startTimestamp?: number;
  latitude?: number;
  longitude?: number;

  //if the Discussion is closed (isActive = false)
  closedByUid?: string;
  closeTimestamp?: number;
  aimAchieved?: boolean;
  acknowledgement?: string; 
}