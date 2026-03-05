import { sileo } from 'sileo';

const EMOJI_REGEX = /[\p{Extended_Pictographic}\uFE0F]/gu;
const SUCCESS_FILL = '#00830e';
const ERROR_FILL = '#d32f2f';
const WARNING_FILL = '#ed6c02';
const INFO_FILL = '#0288d1';

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

const withDefaultFill = (options, fill) => {
  if (!options || typeof options !== 'object') return options;
  if (options.fill) return options;
  return { ...options, fill };
};

export const notify = {
  success: (input) => sileo.success(withDefaultFill(toOptions(input), SUCCESS_FILL)),
  error: (input) => sileo.error(withDefaultFill(toOptions(input), ERROR_FILL)),
  warning: (input) => sileo.warning(withDefaultFill(toOptions(input), WARNING_FILL)),
  info: (input) => sileo.info(withDefaultFill(toOptions(input), INFO_FILL)),
  action: (input) => sileo.action(toOptions(input)),
  show: (input) => sileo.show(toOptions(input)),
  promise: (promise, options) => sileo.promise(promise, options),
  dismiss: (id) => sileo.dismiss(id),
  clear: (position) => sileo.clear(position),
};
