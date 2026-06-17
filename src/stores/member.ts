import { defineStore } from 'pinia'

import { createMember, fetchMembers, type Member, type MemberCreatePayload } from '@/api/member'

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
        this.members = []
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
