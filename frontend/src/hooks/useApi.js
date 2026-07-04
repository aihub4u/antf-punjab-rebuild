import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export function useComplaintInfo(id) {
  return useQuery({
    queryKey: ['close-status', id],
    queryFn: async () => (await api.get(`/close-status/${id}`)).data,
    enabled: !!id,
  });
}

export function useDistricts() {
  return useQuery({
    queryKey: ['districts'],
    queryFn: async () => (await api.get('/close-status/districts')).data,
    staleTime: Infinity, // districts don't change often, no need to refetch
  });
}

export function usePoliceStations(districtId) {
  return useQuery({
    queryKey: ['police-stations', districtId],
    queryFn: async () => (await api.get(`/close-status/police-stations/${districtId}`)).data,
    enabled: !!districtId && districtId !== '0',
  });
}

export function useCloseComplaint(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => (await api.post(`/close-status/${id}`, formData)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['close-status', id] });
    },
  });
}

export function useViewRequest(filters) {
  return useQuery({
    queryKey: ['view-request', filters],
    queryFn: async () => (await api.get('/view-request', { params: filters })).data,
    enabled: !!filters.fromDate && !!filters.toDate,
  });
}

export function useDashboard(filters) {
  return useQuery({
    queryKey: ['dashboard', filters],
    queryFn: async () => (await api.get('/dashboard', { params: filters })).data,
  });
}

export function useDistrictWiseReport(filters) {
  return useQuery({
    queryKey: ['report-district-wise', filters],
    queryFn: async () => (await api.get('/reports/district-wise', { params: filters })).data,
    enabled: !!filters.fromDate && !!filters.toDate,
  });
}

export function useDistrictWiseAbstract(filters) {
  return useQuery({
    queryKey: ['report-district-wise-abstract', filters],
    queryFn: async () => (await api.get('/reports/district-wise-abstract', { params: filters })).data,
    enabled: !!filters.fromDate && !!filters.toDate,
  });
}

export function useComplaintDetail(params) {
  return useQuery({
    queryKey: ['report-complaint-detail', params],
    queryFn: async () => (await api.get('/reports/complaint-detail', { params })).data,
    enabled: !!params.districtId,
  });
}

export function useVdcAbstractDetail(params) {
  return useQuery({
    queryKey: ['report-vdc-abstract-detail', params],
    queryFn: async () => (await api.get('/reports/vdc-abstract-detail', { params })).data,
    enabled: !!params.districtId,
  });
}

export function useEmployees(filters) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: async () => (await api.get('/employees', { params: filters })).data,
  });
}

export function useDeleteEmployees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => (await api.delete('/employees', { data: { ids } })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useDesignations() {
  return useQuery({
    queryKey: ['designations'],
    queryFn: async () => (await api.get('/employees/meta/designations')).data,
    staleTime: Infinity,
  });
}

export function useOfficeTypes() {
  return useQuery({
    queryKey: ['office-types'],
    queryFn: async () => (await api.get('/employees/meta/office-types')).data,
    staleTime: Infinity,
  });
}

export function useOffices(parentId, type) {
  return useQuery({
    queryKey: ['offices', type, parentId],
    queryFn: async () => (await api.get('/employees/meta/offices', { params: { parentId, type } })).data,
    enabled: !!type && !!parentId && parentId !== '0',
  });
}

export function useEmployee(id) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => (await api.get(`/employees/${id}`)).data,
    enabled: !!id,
  });
}

export function useSaveEmployee(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      id
        ? (await api.put(`/employees/${id}`, payload)).data
        : (await api.post('/employees', payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });
}
