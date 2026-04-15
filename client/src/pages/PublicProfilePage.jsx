import { useParams } from 'react-router-dom';

export default function PublicProfilePage() {
  const { id } = useParams();
  return <div>PublicProfilePage - ID: {id}</div>;
}
