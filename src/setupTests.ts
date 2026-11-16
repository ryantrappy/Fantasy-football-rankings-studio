// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { configure } from '@testing-library/dom';

// findBy*/waitFor default to 1000ms, which is too tight for the heavy
// forecast/calibration renders when the full suite runs under load (CI and
// low-CPU machines). Give async queries the same headroom as the slow tests.
configure({ asyncUtilTimeout: 10000 });
