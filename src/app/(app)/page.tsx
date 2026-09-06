import { BenchMap } from '@/components/Map/BenchMap';
import { NotificationsBell } from '@/components/NotificationsBell';

export default function MapPage({ searchParams }: { searchParams: { bench?: string } }) {
  return (
    <>
      <NotificationsBell />
      <BenchMap shareBenchId={searchParams.bench} />
    </>
  );
}
