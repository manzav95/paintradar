import { Navigate, useParams } from 'react-router-dom'

export function ChangeOrderJob() {
  const { estimateId } = useParams()
  return <Navigate to={`/sales/jobs/${estimateId}`} replace />
}
