import { User } from './user.model';

export class Answer{

  areaId?: string;
  communityId?: string;
  answerId?: string;
  questionId: string;

  answer: string;

  uid: string;
  user?: User;
  voteUpUids?: string[];
  voteUpCount?: number;
  voteDownUids?: string[];
  voteDownCount?: number;
  isAccepted?: boolean;
  acceptedTimestamp?: number;

  timestamp?: number;  
  latitude?: number;
  longitude?: number;

}