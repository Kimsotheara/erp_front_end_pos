// Which feature module group a business type unlocks.
// Core modules are always available; pharmacy / pub / minimart are gated.
export const BUSINESS_TYPES = [
  'MINI_MART',
  'PHARMACY',
  'CONVENIENCE',
  'PUB',
  'COFFEE_SHOP',
  'RESTAURANT',
  'RETAIL',
]

const PHARMACY = ['PHARMACY']
const PUB = ['PUB', 'COFFEE_SHOP', 'RESTAURANT']
const MINIMART = ['MINI_MART', 'CONVENIENCE', 'RETAIL']

export function enabledFeatureGroups(businessType) {
  return {
    pharmacy: PHARMACY.includes(businessType),
    pub: PUB.includes(businessType),
    minimart: MINIMART.includes(businessType),
  }
}

// Returns true if a nav item with the given `feature` tag should be visible.
export function isFeatureVisible(feature, businessType) {
  if (!feature) return true // core module
  const groups = enabledFeatureGroups(businessType)
  return !!groups[feature]
}
