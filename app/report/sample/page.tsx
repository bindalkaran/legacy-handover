import ReportView from '@/components/ReportView';
import type { StoredScore } from '@/lib/report';

export const metadata = { title: 'Sample succession report', description: 'See a full sample Legacy Handover report for an illustrative distribution business: three scores with their components, ten succession paths, an indicative value range and a readiness plan.', alternates: { canonical: '/report/sample' } };

const SAMPLE: StoredScore = {
  transferability: 74, readiness: 62, independence: 48, dependency: 68,
  components: [['Financial quality', 86, 20], ['Management depth', 61, 15], ['Owner independence', 42, 15], ['Customer concentration', 74, 10], ['Documentation', 81, 10], ['Operations', 79, 10], ['Legal readiness', 70, 10], ['Revenue quality', 66, 5], ['Employee stability', 83, 5]].map(([k, s, w]) => ({ k: k as string, s: s as number, w: w as number })),
  value_low: 5.5, value_high: 6.8, revenue_mid: 7.5, profit: 1.2, data_quality: 'Good',
  inputs: { hasSucc: 1, succWho: 0, managers: 2, secondLine: 1, future: 1, exitType: 2, revenue: 2, employees: 2, retention: 2 },
  labels: { industry: 'Distribution', revenue: '₹5–10 Cr', employees: '21–50', years: '10–20', succWho: 'Family member', timeline: '3–5 years' },
  score_version: 'score-v1.0', assessment_version: 'assess-v1.0'
};

export default function SampleReport() {
  return <ReportView s={SAMPLE} unlocked sample />;
}
