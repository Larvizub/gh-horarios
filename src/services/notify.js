import { sileo } from 'sileo';

const toOptions = (input) => {
  if (typeof input === 'string') {
    return { title: input };
  }

  if (input instanceof Error) {
    return {
      title: 'Error',
      description: input.message,
    };
  }

  return input || {};
};

export const notify = {
  success: (input) => sileo.success(toOptions(input)),
  error: (input) => sileo.error(toOptions(input)),
  warning: (input) => sileo.warning(toOptions(input)),
  info: (input) => sileo.info(toOptions(input)),
  action: (input) => sileo.action(toOptions(input)),
  show: (input) => sileo.show(toOptions(input)),
  promise: (promise, options) => sileo.promise(promise, options),
  dismiss: (id) => sileo.dismiss(id),
  clear: (position) => sileo.clear(position),
};
