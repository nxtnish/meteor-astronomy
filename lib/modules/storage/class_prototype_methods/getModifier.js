import utilGetModifier from '../utils/getModifier';

function getModifier() {
  let doc = this;

  return utilGetModifier({
    doc
  });
};

function getModifierAsync() {
  return Promise.resolve(getModifier.call(this));
}

export { getModifierAsync };
export default getModifier;
