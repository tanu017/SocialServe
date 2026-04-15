import { useParams } from 'react-router-dom';

export default function NeedDetailPage() {
  const { id } = useParams();
  return <div>NeedDetailPage - ID: {id}</div>;
}
