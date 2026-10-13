import { fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { HistoryAnalytics } from './HistoryAnalytics';

it('exposes archive groups through keyboard-accessible tabs and preserves their selections', () => {
  render(
    <ChakraProvider value={defaultSystem}>
      <HistoryAnalytics records={[]} years={[2024]} leagueId="league" />
    </ChakraProvider>,
  );
  const competition = screen.getByRole('tab', { name: 'Competition' });
  expect(competition).toHaveAttribute('aria-selected', 'true');
  expect(screen.queryByLabelText('Moments season')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Show playful activity labels')).not.toBeInTheDocument();
  for (const tab of screen.getAllByRole('tab')) {
    expect(document.getElementById(tab.getAttribute('aria-controls')!)).toBeInTheDocument();
  }
  fireEvent.keyDown(competition, { key: 'ArrowRight' });
  const moments = screen.getByRole('tab', { name: 'Matchup stories' });
  expect(moments).toHaveFocus();
  expect(moments).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', moments.id);
  expect(screen.getByLabelText('Moments season')).toHaveValue('2024');
  expect(screen.queryByLabelText('Show playful activity labels')).not.toBeInTheDocument();
  fireEvent.keyDown(moments, { key: 'End' });
  expect(screen.getByRole('tab', { name: 'Manager profiles' })).toHaveFocus();
  fireEvent.click(screen.getByText('Transaction activity', { selector: 'summary' }));
  const labels = screen.getByLabelText('Show playful activity labels');
  fireEvent.click(labels);
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Manager profiles' }), { key: 'Home' });
  expect(competition).toHaveFocus();
  expect(screen.getByText(/Missing seasons:/)).toHaveTextContent('2024');
  fireEvent.click(screen.getByRole('tab', { name: 'Manager profiles' }));
  expect(labels).toBeChecked();
});
