export function formatErrorText(appName: string, err: any): string {
  let errorText = `[${appName}] [FATAL] Uncaught Exception: `;
  if (err && err?.response && err?.response?.data) {
    // http exceptions
    errorText += JSON.stringify(err.response.data);
  } else {
    // standard exceptions
    errorText += err?.message + err?.stack;
  }
  return errorText;
}

export const objectToDotNotation = (args: Record<string, any>) => {
  const setObject = {};
  Object.keys(args).forEach((key) => {
    if (typeof args[key] === 'object' && args[key]) {
      Object.keys(args[key]).forEach((subkey) => {
        setObject[`${key}.${subkey}`] = args[key][subkey];
      });
    } else {
      setObject[key] = args[key];
    }
  });
  return setObject;
};
