import { User } from './user.model';

export interface DiscussionMessage {

  messageId?: string;
  areaId?: string;
  communityId?: string;
  discussionId?: string;

  message: string;
  uid: string;
  user?: User;
  timestamp: number;

  latitude?: number;
  longitude?: number;
}