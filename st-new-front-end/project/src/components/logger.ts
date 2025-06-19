import log from 'loglevel';

const level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn';
log.setLevel(level);

export const logger = log;