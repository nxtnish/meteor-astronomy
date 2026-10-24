import { EJSON } from 'meteor/ejson';

function fail(message) {
  throw new Error(message || 'Assertion failed');
}

export const assert = {
  deepEqual(actual, expected, message) {
    if (!EJSON.equals(actual, expected)) {
      fail(message || `Expected ${EJSON.stringify(actual)} to equal ${EJSON.stringify(expected)}`);
    }
  },
  instanceOf(actual, ExpectedClass, message) {
    if (!(actual instanceof ExpectedClass)) {
      fail(message || `Expected value to be an instance of ${ExpectedClass.name}`);
    }
  },
  isFalse(actual, message) {
    if (actual !== false) {
      fail(message || `Expected ${actual} to be false`);
    }
  },
  isNull(actual, message) {
    if (actual !== null) {
      fail(message || `Expected ${actual} to be null`);
    }
  },
  isTrue(actual, message) {
    if (actual !== true) {
      fail(message || `Expected ${actual} to be true`);
    }
  },
  isUndefined(actual, message) {
    if (actual !== undefined) {
      fail(message || `Expected ${actual} to be undefined`);
    }
  }
};
