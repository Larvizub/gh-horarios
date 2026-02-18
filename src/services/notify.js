import { sileo } from 'sileo';

const EMOJI_REGEX = /[\p{Extended_Pictographic}\uFE0F]/gu;

const sanitizeText = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(EMOJI_REGEX, '').replace(/\s{2,}/g, ' ').trim();
};

const sanitizeOptions = (options) => {
  if (!options || typeof options !== 'object') return options;

  return {
    ...options,
    title: sanitizeText(options.title),
    description: sanitizeText(options.description),
  };
};

const toOptions = (input) => {
  if (typeof input === 'string') {
    return sanitizeOptions({ title: input });
  }

  if (input instanceof Error) {
    return sanitizeOptions({
      title: 'Error',
      description: input.message,
    });
  }

  return sanitizeOptions(input || {});
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
