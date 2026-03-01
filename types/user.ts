export interface UserStreak {
  current: number
  longest: number
  lastActivity: number // Unix timestamp (ms)
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  createdAt: number
  xp: number
  level: number
  streak: UserStreak
  achievements: string[]    // масив id розблокованих досягнень
  friends?: string[]        // accepted friend uids
  friendRequestsIn?: string[] // pending incoming request uids
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined'

export interface FriendRequest {
  id: string
  from: string   // uid
  to: string     // uid
  status: FriendRequestStatus
  createdAt: number
}
