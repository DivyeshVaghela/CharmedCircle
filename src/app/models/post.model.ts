import { User } from './user.model';

export interface Post{
  postId?: string;
  title: string;
  subtitle?: string;
  content: string;

  areaId: string;
  communityId: string;
  timestamp?: number;

  uid: string;
  user?: User;
  thumbsUpUids?: string[];
  thumbsUpCount?: number;
  latitude?: number;
  longitude?: number;

  imageUrls?: string[];
}