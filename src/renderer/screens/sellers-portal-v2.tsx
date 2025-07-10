/**
 * Sellers Portal V2 Screen
 * Main screen component that integrates with the routing system
 */

import { SellersPortalV2 } from '../components/sellers-portal-v2'
import type { AgentProfile, ClientProfile } from '../../shared/types'

interface SellersPortalV2ScreenProps {
  navigate?: (path: string) => void
  currentUser?: AgentProfile | ClientProfile | null
  userType?: 'agent' | 'buyer' | 'seller' | null
}

export function SellersPortalV2Screen({
  navigate,
  currentUser,
  userType,
}: SellersPortalV2ScreenProps) {
  return (
    <SellersPortalV2
      navigate={navigate}
      currentUser={currentUser}
      userType={userType}
    />
  )
} 