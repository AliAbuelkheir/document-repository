export interface Tag {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TagListParams {
  search?: string;
  isActive?: boolean;
}
