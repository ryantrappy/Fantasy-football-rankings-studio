export function KeyboardShortcutReference() {
  return (
    <details className="shortcut-reference">
      <summary>Keyboard shortcuts</summary>
      <div>
        <p>Tab to a team’s drag handle or move button before using these keys.</p>
        <dl>
          <div>
            <dt>
              <kbd>Space</kbd> or <kbd>Enter</kbd>
            </dt>
            <dd>Lift the focused team; press again to drop it.</dd>
          </div>
          <div>
            <dt>
              <kbd>↑</kbd> <kbd>↓</kbd>
            </dt>
            <dd>Move a lifted team through the ranking.</dd>
          </div>
          <div>
            <dt>
              <kbd>Escape</kbd>
            </dt>
            <dd>Cancel a keyboard drag without changing the order.</dd>
          </div>
          <div>
            <dt>
              <kbd>Enter</kbd> or <kbd>Space</kbd>
            </dt>
            <dd>Activate a move-up, move-down, or Undo move button.</dd>
          </div>
        </dl>
        <p>These keys keep their normal behavior while you type in a commentary field.</p>
      </div>
    </details>
  );
}
