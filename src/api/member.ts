import { http, type ApiResponse } from './http'

export interface Member {
  id: number
  memberNo: string
  name: string
  mobile: string
  level: string
  points: number
  status: number
  createdAt?: string
  updatedAt?: string
}

export interface MemberCreatePayload {
  name: string
  mobile: string
  level?: string
  points?: number
}

export async function fetchMembers(keyword = '') {
  const response = await http.get<ApiResponse<Member[]>>('/members', {
    params: keyword ? { keyword } : undefined
  })
  return response.data.data
}

export async function createMember(payload: MemberCreatePayload) {
  const response = await http.post<ApiResponse<Member>>('/members', payload)
  return response.data.data
}
