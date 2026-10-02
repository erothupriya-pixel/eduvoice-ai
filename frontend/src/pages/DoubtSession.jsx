import DoubtSessionView from '../components/DoubtSessionView';

export default function DoubtSessionPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <span>💬</span> AI Doubt Session
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Ask any doubt from your study material or engineering subjects. Get step-by-step explanations in simple spoken Telugu or English with voice playback!
        </p>
      </div>

      <DoubtSessionView />
    </div>
  );
}
