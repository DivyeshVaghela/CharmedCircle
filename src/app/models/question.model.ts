import { User } from './user.model';

export interface Question{

  questionId?: string;
  question: string;
  details: string;

  areaId: string;
  communityId: string;

  uid: string;
  user?: User;
  voteUpUids?: string[];
  voteUpCount?: number;
  voteDownUids?: string[];
  voteDownCount?: number;

  timestamp?: number;  
  latitude?: number;
  longitude?: number;

}