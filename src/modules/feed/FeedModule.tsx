import { Scores } from './Scores';
import { News } from './News';

export default function FeedModule() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Live Feed</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Deliberately low-data: text scores and one-line headlines, cached for offline reading.
        </p>
      </header>
      <Scores />
      <News />
    </div>
  );
}
