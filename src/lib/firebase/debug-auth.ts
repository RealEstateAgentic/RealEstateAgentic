/**
 * Debug utilities for real Firebase authentication issues
 */

import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

/**
 * Debug agent authentication issues
 */
export const debugAgentAuth = async (email: string, password: string) => {
  try {
    console.log('🔍 Debug: Starting authentication debug for:', email)

    // Step 1: Try Firebase Auth
    console.log('🔍 Debug: Attempting Firebase Auth sign in...')
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    console.log('✅ Debug: Firebase Auth successful')
    console.log('🔍 Debug: User UID:', userCredential.user.uid)
    console.log('🔍 Debug: User email:', userCredential.user.email)
    console.log('🔍 Debug: Email verified:', userCredential.user.emailVerified)

    // Step 2: Check Firestore document
    console.log('🔍 Debug: Checking Firestore document...')
    const userDocRef = doc(db, 'users', userCredential.user.uid)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      console.log('❌ Debug: Firestore document does not exist!')
      console.log(
        '🔍 Debug: Document path:',
        `users/${userCredential.user.uid}`
      )

      // Create the missing agent profile
      console.log('🔧 Debug: Creating missing agent profile...')
      const agentProfile = {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || email.split('@')[0],
        emailVerified: userCredential.user.emailVerified,
        role: 'agent',
        licenseNumber: 'AUTO-GENERATED-001',
        brokerage: 'Default Brokerage',
        phoneNumber: '(555) 123-4567',
        specialties: ['Residential'],
        yearsExperience: 1,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(userDocRef, agentProfile)
      console.log('✅ Debug: Agent profile created successfully!')

      return {
        uid: userCredential.user.uid,
        ...agentProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    } else {
      console.log('✅ Debug: Firestore document exists')
      const userData = userDoc.data()
      console.log('🔍 Debug: Document data:', userData)
      console.log('🔍 Debug: User role:', userData?.role)

      if (userData?.role !== 'agent') {
        console.log('❌ Debug: User role is not "agent"!')
        console.log('🔧 Debug: Updating role to "agent"...')

        // Update the role to agent
        await setDoc(
          userDocRef,
          { ...userData, role: 'agent' },
          { merge: true }
        )
        console.log('✅ Debug: Role updated to "agent"')
      }

      return {
        uid: userDoc.id,
        ...userData,
        createdAt:
          userData.createdAt?.toDate?.()?.toISOString() || userData.createdAt,
        updatedAt:
          userData.updatedAt?.toDate?.()?.toISOString() || userData.updatedAt,
      }
    }
  } catch (error: any) {
    console.error('❌ Debug: Authentication debug failed:', error)
    throw error
  }
}

/**
 * List all users in Firestore for debugging
 */
export const listFirestoreUsers = async () => {
  try {
    console.log(
      '🔍 Debug: This would list Firestore users (requires admin SDK)'
    )
    console.log(
      '🔍 Debug: Check Firebase Console > Firestore > users collection'
    )
  } catch (error) {
    console.error('❌ Debug: Failed to list users:', error)
  }
}
