import _each from "lodash/each";
import utilGetModified from "../utils/getModified";
import rawOne from "../../fields/utils/rawOne";

function getModifiedValues(options = {}) {
  let { old = false, raw = false, fields } = options;

  let doc = this;
  const Class = doc.constructor;

  // Get list of modified fields.
  const modified = utilGetModified({
    doc,
    transient: true,
    fields
  });

  if (modified && typeof modified.then === "function") {
    return modified.then(async (fieldNames) => {
      let valuesDoc = doc;
      if (old) {
        valuesDoc = await Class.findOneAsync(doc._id);
        if (!valuesDoc) {
          valuesDoc = new Class();
        }
      }
      return collectValues(valuesDoc, fieldNames, raw);
    });
  }

  // Get old or new values of a document.
  if (old) {
    doc = Class.findOne(doc._id);
    if (!doc) {
      doc = new Class();
    }
  }

  // Collect values for each field.
  return collectValues(doc, modified, raw);
}

function collectValues(doc, modified, raw) {
  const values = {};
  _each(modified, name => {
    values[name] = raw ? rawOne(doc, name) : doc.get(name);
  });
  return values;
}

function getModifiedValuesAsync(options = {}) {
  return Promise.resolve(getModifiedValues.call(this, options));
}

export { getModifiedValuesAsync };
export default getModifiedValues;
