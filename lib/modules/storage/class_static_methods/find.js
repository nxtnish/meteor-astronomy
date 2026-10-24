import _defaults from 'lodash/defaults';
import _has from 'lodash/has';
import _isNull from 'lodash/isNull';
import _map from 'lodash/map';
import config from '../../../core/config';
import wrapTransform from '../utils/wrapTransform';
import transformToClass from '../utils/transformToClass';
import Event from '../../events/event';
import { Mongo } from 'meteor/mongo';

function createMethod(methodName, asyncMode = false) {
  return function(selector, options) {
    let Class = this;
    let Collection = Class.getCollection();

    // Get selector from arguments.
    if (arguments.length === 0) {
      selector = {};
    }
    else {
      selector = arguments[0];
    }
    // If selector is null then just proceed to collection's find method.
    if (_isNull(selector)) {
      return Collection[methodName](selector, options);
    }
    // Rewrite selector to make it an object.
    selector = Mongo.Collection._rewriteSelector(selector);

    // Set default options.
    options = _defaults({}, options, {
      defaults: config.defaults,
      children: true,
      // We don't want to clone raw object in the "find" method.
      clone: false
    });

    const beforeFind = () => {
      if (options.disableEvents) {
        return;
      }
      const event = new Event('beforeFind', {
        selector,
        options
      });
      return asyncMode
        ? Class.dispatchEventAsync(event)
        : Class.dispatchEvent(event);
    };
    const afterFind = (result) => {
      if (options.disableEvents) {
        return;
      }
      const event = new Event('afterFind', {
        selector,
        options,
        result
      });
      return asyncMode
        ? Class.dispatchEventAsync(event)
        : Class.dispatchEvent(event);
    };

    if (asyncMode) {
      return (async () => {
        await beforeFind();
        const result = await executeFind(
          Class, Collection, methodName, selector, options
        );
        await afterFind(result);
        return result;
      })();
    }

    beforeFind();

    const result = executeFind(
      Class, Collection, methodName, selector, options
    );

    if (result && typeof result.then === 'function') {
      return result.then((resolvedResult) => {
        afterFind(resolvedResult);
        return resolvedResult;
      });
    }

    afterFind(result);
    return result;
  };
}

function executeFind(Class, Collection, methodName, selector, options) {
  const typeField = Class.getTypeField();
  if (
    // If it's an inherited class, then get only documents being instances of
    // the subclass...
    typeField &&
    // ... however do not override a type property in selector when
    // developer provided it and wants to deal with it by him/herself.
    !_has(selector, typeField)
  ) {
    // If a class has child classes then we have to fetch document being
    // instances of the parent and child classes depending on a value of
    // the "children" option.
    const children = Class.getChildren(options.children);
    if (options.children && children.length > 0) {
      children.push(Class);
      selector[typeField] = {
        $in: _map(children, (Child) => Child.getName())
      };
    }
    else {
      selector[typeField] = Class.getName();
    }
  }

  const classTransform = Class.getTransform();
  if (options.transform !== null && classTransform !== null) {
    // Wrap the transform function with the "wrapTransform" function, which
    // resolves values.
    options.transform = wrapTransform({
      Class,
      // First, try getting the transform function passed to the "find"
      // method. Later, check if the transform function is defined in the
      // class definition. If none of them contains a transform function, then
      // get the default one.
      transform: options.transform || classTransform || transformToClass({
        Class,
        options
      })
    });
  }

  return Collection[methodName](selector, options);
}

const find = createMethod('find');
const findOne = createMethod('findOne');
const findOneAsync = createMethod('findOneAsync', true);

export { find, findOne, findOneAsync };
