function handleResult(result, callback) {
  if (result && typeof result.then === 'function') {
    if (callback) {
      result.then(
        value => callback(undefined, value),
        error => callback(error)
      );
    }
    return result;
  }

  if (callback) {
    callback(undefined, result);
  }
  return result;
}

export default handleResult;
