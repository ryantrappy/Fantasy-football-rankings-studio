import { warmTab } from '../tab-data';
import { createFileRoute } from '@tanstack/react-router';
import { TradeAnalyzerPage } from '../components/TradeAnalyzerPage';
export const Route = createFileRoute('/_authenticated/trades')({
  loader: ({ context }) => warmTab('trades', context),
  component: TradeAnalyzerPage,
});
