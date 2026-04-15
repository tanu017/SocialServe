import { useParams } from 'react-router-dom';

export default function DonationDetailPage() {
  const { id } = useParams();
  return <div>DonationDetailPage - ID: {id}</div>;
}
