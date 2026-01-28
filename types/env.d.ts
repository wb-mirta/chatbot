declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_TELEGRAM_TOKEN: string | undefined
      APP_TELEGRAM_USER: string | undefined
    }
  }
}

export { }
