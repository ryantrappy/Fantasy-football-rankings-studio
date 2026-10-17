import { fireEvent, render, screen } from '@testing-library/react';
import { PersistentDisclosure } from './DisclosureMotion';

it('retains edited content and removes closing content from interaction immediately during rapid reopening', () => {
  render(
    <PersistentDisclosure label="Settings" className="settings" contentClassName="settings-content">
      <input aria-label="Notes" defaultValue="" />
    </PersistentDisclosure>,
  );
  const trigger = screen.getByRole('button', { name: 'Settings' });
  const panel = document.querySelector('.settings-content')!;
  expect(panel).toHaveAttribute('hidden');
  fireEvent.click(trigger);
  const input = screen.getByRole('textbox', { name: 'Notes' });
  fireEvent.change(input, { target: { value: 'Retained notes' } });
  input.focus();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(trigger).toHaveFocus();
  expect(panel).toHaveAttribute('inert');
  expect(panel).toHaveAttribute('aria-hidden', 'true');
  fireEvent.click(trigger);
  fireEvent.click(trigger);
  fireEvent.click(trigger);
  expect(panel).not.toHaveAttribute('inert');
  expect(panel).not.toHaveAttribute('hidden');
  expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('Retained notes');
});

it('dismisses same-route account actions and returns focus when dismissing from a non-focusable outside target', () => {
  render(
    <>
      <PersistentDisclosure
        label="Account"
        className="account"
        contentClassName="account-content"
        closeOnAction
      >
        <a href="#account">Edit account</a>
      </PersistentDisclosure>
      <p>Outside</p>
    </>,
  );
  const trigger = screen.getByRole('button', { name: 'Account' });
  fireEvent.click(trigger);
  const link = screen.getByRole('link');
  link.focus();
  fireEvent.pointerDown(screen.getByText('Outside'));
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(trigger);
  fireEvent.click(link);
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
