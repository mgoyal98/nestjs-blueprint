export function formatErrorText(appName: string, err: any): string {
  let errorText = `Uncaught Exception: `;
  if (err && err?.response && err?.response?.data) {
    // http exceptions
    errorText += JSON.stringify(err.response.data);
  } else {
    // standard exceptions
    errorText += err?.message + err?.stack;
  }
  return errorText;
}
