export type AppStatus = 'IDEA' | 'PLANNING' | 'BUILDING' | 'TESTING' | 'DEPLOYING' | 'LIVE' | 'PAUSED' | 'ARCHIVED'

export function getStatusBadgeColor(status: AppStatus): string {
  switch (status) {
    case 'IDEA':
      return 'bg-purple-100 text-purple-800'
    case 'PLANNING':
      return 'bg-blue-100 text-blue-800'
    case 'BUILDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'TESTING':
      return 'bg-orange-100 text-orange-800'
    case 'DEPLOYING':
      return 'bg-indigo-100 text-indigo-800'
    case 'LIVE':
      return 'bg-green-100 text-green-800'
    case 'PAUSED':
      return 'bg-gray-100 text-gray-800'
    case 'ARCHIVED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusBadgeClass(status: AppStatus): string {
  return `text-xs px-2 py-1 rounded ${getStatusBadgeColor(status)}`
}
