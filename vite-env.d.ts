// Fix for "Cannot find type definition file for 'vite/client'"
// Manually defining process.env used in the application
declare const process: {
  env: {
    [key: string]: string | undefined;
    API_KEY: string;
  }
};
