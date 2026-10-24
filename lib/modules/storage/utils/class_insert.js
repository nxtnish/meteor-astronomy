import AstroClass from '../../../core/class.js';
import documentInsert from './document_insert.js';

function classInsert(args = {}) {
  const {
    className,
    rawDoc,
    stopOnFirstError,
    fields,
    simulation = true,
    trusted = false,
    async = false,
  } = args;

  // Stop execution, if we are not on the server, when the "simulation" flag is
  // not set.
  if (!simulation && !Meteor.isServer) {
    return;
  }

  const Class = AstroClass.get(className);
  // Create a new document.
  const doc = new Class(rawDoc);

  // Insert a document.
  return documentInsert({
    doc,
    stopOnFirstError,
    fields,
    simulation,
    trusted,
    async,
  });
};

export default classInsert;
