import utilIsModified from '../utils/isModified';

function isModified(pattern) {
	let doc = this;

	return utilIsModified({
		doc,
		pattern,
		transient: true
	});
};

function isModifiedAsync(pattern) {
	return Promise.resolve(isModified.call(this, pattern));
}

export { isModifiedAsync };
export default isModified;
