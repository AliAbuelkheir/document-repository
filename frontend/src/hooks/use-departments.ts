'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '@/services/department.service';
import type { DepartmentInput } from '@/types/department';

export const departmentKeys = {
  all: ['departments'] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.all,
    queryFn: listDepartments,
  });
}

/** Users show department names, and a delete removes the document grants of the department. */
function useInvalidateDepartmentData() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: departmentKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['users'] }),
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
    ]);
  };
}

export function useCreateDepartment() {
  const invalidateDepartmentData = useInvalidateDepartmentData();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: invalidateDepartmentData,
  });
}

interface UpdateDepartmentVariables {
  id: string;
  input: DepartmentInput;
}

export function useUpdateDepartment() {
  const invalidateDepartmentData = useInvalidateDepartmentData();
  return useMutation({
    mutationFn: ({ id, input }: UpdateDepartmentVariables) => updateDepartment(id, input),
    onSuccess: invalidateDepartmentData,
  });
}

export function useDeleteDepartment() {
  const invalidateDepartmentData = useInvalidateDepartmentData();
  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: invalidateDepartmentData,
  });
}
