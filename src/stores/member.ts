import { defineStore } from 'pinia'

import { createMember, fetchMembers, type Member, type MemberCreatePayload } from '@/api/member'

const fallbackMembers: Member[] = Array.from({ length: 12 }, (_, index) => {
  const id = index + 1
  return {
    id,
    memberNo: `M20260616${String(id).padStart(4, '0')}`,
    name: id % 2 === 0 ? `Ben Li ${id}` : `Alice Chen ${id}`,
    mobile: `1380000${String(id).padStart(4, '0')}`,
    level: id % 3 === 0 ? 'VIP' : 'NORMAL',
    points: 100 + id * 45,
    status: id % 5 === 0 ? 0 : 1,
    createdAt: `2026-06-16 09:${String(id).padStart(2, '0')}:00`
  }
})

export const useMemberStore = defineStore('member', {
  state: () => ({
    members: [] as Member[],
    keyword: '',
    loading: false,
    apiAvailable: true,
    errorMessage: ''
  }),
  getters: {
    enabledCount: (state) => state.members.filter((member) => member.status === 1).length,
    totalPoints: (state) => state.members.reduce((sum, member) => sum + member.points, 0),
    vipCount: (state) => state.members.filter((member) => member.level === 'VIP').length
  },
  actions: {
    async loadMembers() {
      this.loading = true
      this.errorMessage = ''
      try {
        this.members = await fetchMembers(this.keyword)
        this.apiAvailable = true
      } catch (error) {
        this.members = fallbackMembers
        this.apiAvailable = false
        this.errorMessage = error instanceof Error ? error.message : 'Backend unavailable'
      } finally {
        this.loading = false
      }
    },
    async addMember(payload: MemberCreatePayload) {
      const member = await createMember(payload)
      this.members = [member, ...this.members]
      return member
    }
  }
})
