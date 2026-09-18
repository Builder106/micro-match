export interface HttpError {
  status: number;
  location?: string;
  body?: { message?: string };
}

export function isHttpError(value: unknown): value is HttpError {
  if (typeof value !== 'object' || value === null || !('status' in value)) {
    return false;
  }

  const error = value as Record<string, unknown>;
  if (typeof error.status !== 'number') {
    return false;
  }

  if ('location' in error && error.location !== undefined && typeof error.location !== 'string') {
    return false;
  }

  if ('body' in error && error.body !== undefined) {
    if (typeof error.body !== 'object' || error.body === null) {
      return false;
    }
    const body = error.body as Record<string, unknown>;
    if ('message' in body && body.message !== undefined && typeof body.message !== 'string') {
      return false;
    }
  }

  return true;
}
