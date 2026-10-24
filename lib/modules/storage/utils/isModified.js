import _includes from "lodash/includes";

import getModified from "./getModified";

function isModified(options = {}) {
  let { doc, pattern, transient = false, immutable = false, oldDoc } = options;

  const modified = getModified({
    doc,
    transient,
    immutable,
    oldDoc
  });

  const getResult = (fieldNames) => {
    if (pattern) {
      return _includes(fieldNames, pattern);
    }

    return fieldNames.length > 0;
  };

  if (modified && typeof modified.then === "function") {
    return modified.then(getResult);
  }

  return getResult(modified);
}

export default isModified;
