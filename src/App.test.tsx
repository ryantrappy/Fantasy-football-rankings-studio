test('test environment is configured', () => {
  expect(document.createElement('div')).toBeInstanceOf(HTMLDivElement);
});
