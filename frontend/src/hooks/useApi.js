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

export function useForwardEmployees(id) {
  return useQuery({
    queryKey: ['forward-employees', id],
    queryFn: async () => (await api.get(`/workflow/employees/${id}`)).data,
    enabled: !!id,
  });
}

export function useForward(id) {
  return useMutation({
    mutationFn: async (formData) => (await api.post(`/workflow/forward/${id}`, formData)).data,
  });
}

export function useReturnAction(id) {
  return useMutation({
    mutationFn: async (formData) => (await api.post(`/workflow/return/${id}`, formData)).data,
  });
}

export function useReopen(id) {
  return useMutation({
    mutationFn: async () => (await api.post(`/workflow/reopen/${id}`)).data,
  });
}

export function useUpdateFirNumber(id) {
  return useMutation({
    mutationFn: async (payload) => (await api.post(`/workflow/fir-number/${id}`, payload)).data,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload) => (await api.post('/change-password', payload)).data,
  });
}

export function useAbstract() {
  return useQuery({
    queryKey: ['abstract'],
    queryFn: async () => (await api.get('/abstract')).data,
  });
}

export function useMyAccountAbstract() {
  return useQuery({
    queryKey: ['abstract-my-account'],
    queryFn: async () => (await api.get('/abstract/my-account')).data,
  });
}

export function useViewDetail(id) {
  return useQuery({
    queryKey: ['view-detail', id],
    queryFn: async () => (await api.get(`/view-detail/${id}`)).data,
    enabled: !!id,
  });
}

export function useAeInfoCategories(parentId) {
  return useQuery({
    queryKey: ['ae-info-categories', parentId],
    queryFn: async () => (await api.get('/ae-info/categories', { params: parentId ? { parentId } : {} })).data,
    enabled: parentId === undefined || (!!parentId && parentId !== '0'),
  });
}

export function useUpdateAeInfo(id) {
  return useMutation({
    mutationFn: async (payload) => (await api.put(`/ae-info/${id}`, payload)).data,
  });
}

export function useSubstance(infoId) {
  return useQuery({
    queryKey: ['substance', infoId],
    queryFn: async () => (await api.get(`/substance/${infoId}`)).data,
    enabled: !!infoId,
  });
}

export function useSaveSubstance(infoId) {
  return useMutation({
    mutationFn: async (payload) => (await api.post(`/substance/${infoId}`, payload)).data,
  });
}

export function useViewRequestAll(filters) {
  return useQuery({
    queryKey: ['view-request-all', filters],
    queryFn: async () => (await api.get('/view-request-all', { params: filters })).data,
    enabled: !!filters.fromDate && !!filters.toDate,
  });
}
