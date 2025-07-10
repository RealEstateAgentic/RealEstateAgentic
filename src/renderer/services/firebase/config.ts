// Re-export Firebase services from the main config to ensure consistency
export { db, storage, auth } from '../../../lib/firebase/config'

console.log('🔥 Firebase services imported from main config successfully')
