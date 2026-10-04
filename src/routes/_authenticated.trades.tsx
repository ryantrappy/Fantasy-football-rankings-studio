import { createFileRoute } from '@tanstack/react-router';
import { TradeAnalyzerPage } from '../components/TradeAnalyzerPage';
export const Route = createFileRoute('/_authenticated/trades')({ component: TradeAnalyzerPage });
