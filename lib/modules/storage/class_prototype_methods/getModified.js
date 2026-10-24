import utilGetModified from "../utils/getModified";

function getModified(options = {}) {
  const doc = this;
  const { fields } = options;

  return utilGetModified({
    doc,
    transient: true,
    fields
  });
}

function getModifiedAsync(options = {}) {
  return Promise.resolve(getModified.call(this, options));
}

export { getModifiedAsync };
export default getModified;
