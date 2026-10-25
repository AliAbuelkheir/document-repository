export interface Department {
  id: string;
  name: string;
  description: string | null;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentInput {
  name: string;
  description: string | null;
}
